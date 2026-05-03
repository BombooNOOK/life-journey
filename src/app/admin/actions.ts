"use server";

import { randomUUID } from "node:crypto";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getViewerEmailFromCookie, normalizeEmail } from "@/lib/auth/viewer";
import { isAdminEmail } from "@/lib/admin/access";
import { prisma } from "@/lib/db";

function clampPdfDownloadLimitPerOrder(raw: string | undefined): number {
  const n = Number.parseInt(String(raw ?? "").trim(), 10);
  if (!Number.isFinite(n)) return 2;
  return Math.min(999, Math.max(0, Math.trunc(n)));
}

/** Server Action 内の notFound() は本番でエラー境界になりやすいので redirect に統一する */
async function requireAdminOrRedirect(): Promise<void> {
  const viewer = await getViewerEmailFromCookie();
  if (!viewer) {
    redirect("/login?returnTo=/admin");
  }
  if (!(await isAdminEmail(viewer))) {
    redirect("/orders");
  }
}

function isPostgresDb(): boolean {
  const u = process.env.DATABASE_URL ?? "";
  if (u.startsWith("file:") || u.includes("sqlite")) return false;
  return (
    u.startsWith("postgresql") ||
    u.startsWith("postgres") ||
    u.startsWith("prisma+postgres") ||
    u.startsWith("prisma+postgresql")
  );
}

function safeRevalidateAdminRelated(): void {
  try {
    revalidatePath("/admin");
  } catch (e) {
    console.warn("[admin] revalidatePath /admin", e);
  }
  try {
    revalidatePath("/orders/bookshelf");
  } catch (e) {
    console.warn("[admin] revalidatePath /orders/bookshelf", e);
  }
  try {
    revalidatePath("/orders", "layout");
  } catch (e) {
    console.warn("[admin] revalidatePath /orders layout", e);
  }
}

/**
 * 鑑定レコードの pdfDownloadLimit をメールで同期。
 * Raw UPDATE が接続先（PgBouncer / Accelerate 等）で失敗する場合があるためフォールバックする。
 */
async function syncOrdersPdfDownloadLimitForNormalizedEmail(
  normalizedEmail: string,
  limit: number,
): Promise<void> {
  try {
    await prisma.$executeRaw`
      UPDATE "Order"
      SET "pdfDownloadLimit" = ${limit}
      WHERE LOWER(TRIM("email")) = LOWER(TRIM(${normalizedEmail}))
    `;
    return;
  } catch (e) {
    console.warn("[admin] syncOrdersPdfDownloadLimit executeRaw failed:", e);
  }

  const exact = await prisma.order.updateMany({
    where: { email: normalizedEmail },
    data: { pdfDownloadLimit: limit },
  });
  if (exact.count > 0) return;

  try {
    const hits = await prisma.order.findMany({
      where: {
        email: { equals: normalizedEmail, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (hits.length === 0) return;
    await prisma.order.updateMany({
      where: { id: { in: hits.map((h) => h.id) } },
      data: { pdfDownloadLimit: limit },
    });
  } catch (e) {
    console.warn("[admin] syncOrdersPdfDownloadLimit insensitive fallback failed:", e);
  }
}

/** 初回マイグレーションの6列のみ。列追加前の本番DBでも upsert 可能。 */
async function upsertAccountSettingsProfilePostgresRaw(
  email: string,
  profileLimit: number,
): Promise<{ id: string }> {
  const newId = randomUUID();
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO "AccountSettings" ("id", "createdAt", "updatedAt", "email", "isAdmin", "profileLimit")
    VALUES (${newId}, NOW(), NOW(), ${email}, false, ${profileLimit})
    ON CONFLICT ("email")
    DO UPDATE SET
      "profileLimit" = EXCLUDED."profileLimit",
      "updatedAt" = NOW()
    RETURNING "id"
  `;
  const id = rows[0]?.id;
  if (!id) throw new Error("upsertAccountSettingsProfilePostgresRaw: no id returned");
  return { id };
}

async function upsertAccountSettingsAdminRolePostgresRaw(
  email: string,
  isAdmin: boolean,
): Promise<{ id: string }> {
  const newId = randomUUID();
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO "AccountSettings" ("id", "createdAt", "updatedAt", "email", "isAdmin", "profileLimit")
    VALUES (${newId}, NOW(), NOW(), ${email}, ${isAdmin}, 1)
    ON CONFLICT ("email")
    DO UPDATE SET
      "isAdmin" = EXCLUDED."isAdmin",
      "updatedAt" = NOW()
    RETURNING "id"
  `;
  const id = rows[0]?.id;
  if (!id) throw new Error("upsertAccountSettingsAdminRolePostgresRaw: no id returned");
  return { id };
}

/** 6列 upsert のあと pdf 列だけ更新（列が無い DB では無視） */
async function upsertAccountSettingsPdfLimitPostgresRaw(
  email: string,
  pdfDownloadLimitPerOrder: number,
): Promise<{ id: string }> {
  const newId = randomUUID();
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO "AccountSettings" ("id", "createdAt", "updatedAt", "email", "isAdmin", "profileLimit")
    VALUES (${newId}, NOW(), NOW(), ${email}, false, 1)
    ON CONFLICT ("email")
    DO UPDATE SET "updatedAt" = NOW()
    RETURNING "id"
  `;
  const id = rows[0]?.id;
  if (!id) throw new Error("upsertAccountSettingsPdfLimitPostgresRaw: no id returned");
  try {
    await prisma.$executeRaw`
      UPDATE "AccountSettings"
      SET "pdfDownloadLimitPerOrder" = ${pdfDownloadLimitPerOrder}
      WHERE "id" = ${id}
    `;
  } catch {
    /* 列未適用 */
  }
  return { id };
}

async function upsertSubscriberAccessPostgresRaw(
  email: string,
  subscriberPdfAccess: boolean,
): Promise<{ id: string }> {
  const newId = randomUUID();
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO "AccountSettings" ("id", "createdAt", "updatedAt", "email", "isAdmin", "profileLimit")
    VALUES (${newId}, NOW(), NOW(), ${email}, false, 1)
    ON CONFLICT ("email")
    DO UPDATE SET "updatedAt" = NOW()
    RETURNING "id"
  `;
  const id = rows[0]?.id;
  if (!id) throw new Error("upsertSubscriberAccessPostgresRaw: no id returned");
  try {
    await prisma.$executeRaw`
      UPDATE "AccountSettings"
      SET "subscriberPdfAccess" = ${subscriberPdfAccess}
      WHERE "id" = ${id}
    `;
  } catch {
    /* 列未適用 */
  }
  return { id };
}

/**
 * 同一ユーザーとみなすメール表記ゆれの行を同期する。
 * Prisma の `mode: insensitive` + AND は環境によって Invalid になるため、PostgreSQL では Raw UPDATE。
 * pdf / subscriber 列が未マイグレーションの DB では該当 UPDATE をスキップ。
 */
async function syncDuplicateAccountRowsForNormalizedEmail(
  mergedId: string,
  normalizedEmail: string,
  data: Prisma.AccountSettingsUpdateManyMutationInput,
): Promise<void> {
  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch {
      /* 列未適用など */
    }
  };

  try {
    if (isPostgresDb()) {
      if (data.profileLimit !== undefined) {
        await run(async () => {
          await prisma.$executeRaw`
            UPDATE "AccountSettings"
            SET "profileLimit" = ${data.profileLimit}
            WHERE "id" <> ${mergedId}
              AND LOWER(TRIM("email")) = LOWER(TRIM(${normalizedEmail}))
          `;
        });
      }
      if (data.isAdmin !== undefined) {
        await run(async () => {
          await prisma.$executeRaw`
            UPDATE "AccountSettings"
            SET "isAdmin" = ${data.isAdmin}
            WHERE "id" <> ${mergedId}
              AND LOWER(TRIM("email")) = LOWER(TRIM(${normalizedEmail}))
          `;
        });
      }
      if (data.pdfDownloadLimitPerOrder !== undefined) {
        await run(async () => {
          await prisma.$executeRaw`
            UPDATE "AccountSettings"
            SET "pdfDownloadLimitPerOrder" = ${data.pdfDownloadLimitPerOrder}
            WHERE "id" <> ${mergedId}
              AND LOWER(TRIM("email")) = LOWER(TRIM(${normalizedEmail}))
          `;
        });
      }
      if (data.subscriberPdfAccess !== undefined) {
        await run(async () => {
          await prisma.$executeRaw`
            UPDATE "AccountSettings"
            SET "subscriberPdfAccess" = ${data.subscriberPdfAccess}
            WHERE "id" <> ${mergedId}
              AND LOWER(TRIM("email")) = LOWER(TRIM(${normalizedEmail}))
          `;
        });
      }
      return;
    }

    await prisma.accountSettings.updateMany({
      where: { email: normalizedEmail },
      data,
    });
  } catch (e) {
    console.warn("[admin] syncDuplicateAccountRows (skipped):", e);
  }
}

export async function updateProfileLimit(formData: FormData) {
  await requireAdminOrRedirect();
  const email = normalizeEmail(formData.get("email")?.toString());
  if (!email) redirect("/admin");

  const profileLimitRaw = formData.get("profileLimit")?.toString();
  const profileLimit = profileLimitRaw === "3" ? 3 : 1;

  let merged: { id: string };
  try {
    merged = await prisma.accountSettings.upsert({
      where: { email },
      create: {
        email,
        profileLimit,
        isAdmin: false,
        pdfDownloadLimitPerOrder: 2,
        subscriberPdfAccess: false,
      },
      update: { profileLimit },
    });
  } catch (e) {
    if (!isPostgresDb()) {
      console.error("[admin] updateProfileLimit", e);
      redirect("/admin?err=profile");
    }
    try {
      merged = await upsertAccountSettingsProfilePostgresRaw(email, profileLimit);
    } catch (e2) {
      console.error("[admin] updateProfileLimit", e, e2);
      redirect("/admin?err=profile");
    }
  }

  try {
    await syncDuplicateAccountRowsForNormalizedEmail(merged.id, email, { profileLimit });
    revalidatePath("/admin");
  } catch (e) {
    console.error("[admin] updateProfileLimit sync", e);
    redirect("/admin?err=profile");
  }
  redirect("/admin?saved=profile");
}

export async function toggleAdminRole(formData: FormData) {
  await requireAdminOrRedirect();
  const email = normalizeEmail(formData.get("email")?.toString());
  if (!email) redirect("/admin");

  const isAdminRaw = formData.get("isAdmin")?.toString();
  const isAdmin = isAdminRaw === "1";

  let merged: { id: string };
  try {
    merged = await prisma.accountSettings.upsert({
      where: { email },
      create: {
        email,
        profileLimit: 1,
        isAdmin,
        pdfDownloadLimitPerOrder: 2,
        subscriberPdfAccess: false,
      },
      update: { isAdmin },
    });
  } catch (e) {
    if (!isPostgresDb()) {
      console.error("[admin] toggleAdminRole", e);
      redirect("/admin?err=admin");
    }
    try {
      merged = await upsertAccountSettingsAdminRolePostgresRaw(email, isAdmin);
    } catch (e2) {
      console.error("[admin] toggleAdminRole", e, e2);
      redirect("/admin?err=admin");
    }
  }

  try {
    await syncDuplicateAccountRowsForNormalizedEmail(merged.id, email, { isAdmin });
    revalidatePath("/admin");
  } catch (e) {
    console.error("[admin] toggleAdminRole sync", e);
    redirect("/admin?err=admin");
  }
  redirect("/admin?saved=admin");
}

/**
 * upsert が環境・データで失敗したとき、大小無視の find + update / create に落とす
 */
async function saveAccountPdfLimitWithFallback(
  email: string,
  pdfDownloadLimitPerOrder: number,
): Promise<{ id: string }> {
  try {
    return await prisma.accountSettings.upsert({
      where: { email },
      create: {
        email,
        profileLimit: 1,
        isAdmin: false,
        pdfDownloadLimitPerOrder,
        subscriberPdfAccess: false,
      },
      update: { pdfDownloadLimitPerOrder },
    });
  } catch (e1) {
    console.warn("[admin] accountSettings upsert failed, using fallback:", e1);
    try {
      const exact = await prisma.accountSettings.findUnique({ where: { email } });
      if (exact) {
        return prisma.accountSettings.update({
          where: { id: exact.id },
          data: { pdfDownloadLimitPerOrder },
        });
      }
    } catch (e2) {
      console.warn("[admin] findUnique fallback:", e2);
    }
    if (isPostgresDb()) {
      try {
        const rows = await prisma.$queryRaw<Array<{ id: string }>>`
          SELECT "id"
          FROM "AccountSettings"
          WHERE LOWER(TRIM("email")) = LOWER(TRIM(${email}))
          LIMIT 1
        `;
        const id = rows[0]?.id;
        if (id) {
          return prisma.accountSettings.update({
            where: { id },
            data: { pdfDownloadLimitPerOrder },
          });
        }
      } catch (e3) {
        console.warn("[admin] raw select AccountSettings by email fallback:", e3);
      }
    } else {
      try {
        const hit = await prisma.accountSettings.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
        });
        if (hit) {
          return prisma.accountSettings.update({
            where: { id: hit.id },
            data: { pdfDownloadLimitPerOrder },
          });
        }
      } catch (e3) {
        console.warn("[admin] findFirst insensitive fallback:", e3);
      }
    }
    if (isPostgresDb()) {
      try {
        return await upsertAccountSettingsPdfLimitPostgresRaw(email, pdfDownloadLimitPerOrder);
      } catch (e4) {
        console.warn("[admin] upsertAccountSettingsPdfLimitPostgresRaw:", e4);
      }
    }
    return prisma.accountSettings.create({
      data: {
        email,
        profileLimit: 1,
        isAdmin: false,
        pdfDownloadLimitPerOrder,
        subscriberPdfAccess: false,
      },
    });
  }
}

export async function updatePdfDownloadLimitPerOrder(formData: FormData) {
  await requireAdminOrRedirect();
  const email = normalizeEmail(formData.get("email")?.toString());
  if (!email) redirect("/admin");

  const pdfDownloadLimitPerOrder = clampPdfDownloadLimitPerOrder(
    formData.get("pdfDownloadLimitPerOrder")?.toString(),
  );

  try {
    const merged = await saveAccountPdfLimitWithFallback(email, pdfDownloadLimitPerOrder);
    await syncDuplicateAccountRowsForNormalizedEmail(merged.id, email, { pdfDownloadLimitPerOrder });
    await syncOrdersPdfDownloadLimitForNormalizedEmail(email, pdfDownloadLimitPerOrder);
    safeRevalidateAdminRelated();
  } catch (e) {
    console.error("[admin] updatePdfDownloadLimitPerOrder", e);
    redirect("/admin?err=pdf");
  }
  redirect("/admin?saved=pdf");
}

export async function toggleSubscriberPdfAccess(formData: FormData) {
  await requireAdminOrRedirect();
  const email = normalizeEmail(formData.get("email")?.toString());
  if (!email) redirect("/admin");

  const subscriberPdfAccess = formData.get("subscriberPdfAccess")?.toString() === "1";

  let merged: { id: string };
  try {
    merged = await prisma.accountSettings.upsert({
      where: { email },
      create: {
        email,
        profileLimit: 1,
        isAdmin: false,
        pdfDownloadLimitPerOrder: 2,
        subscriberPdfAccess,
      },
      update: { subscriberPdfAccess },
    });
  } catch (e) {
    if (!isPostgresDb()) {
      console.error("[admin] toggleSubscriberPdfAccess", e);
      redirect("/admin?err=sub");
    }
    try {
      merged = await upsertSubscriberAccessPostgresRaw(email, subscriberPdfAccess);
    } catch (e2) {
      console.error("[admin] toggleSubscriberPdfAccess", e, e2);
      redirect("/admin?err=sub");
    }
  }

  try {
    await syncDuplicateAccountRowsForNormalizedEmail(merged.id, email, { subscriberPdfAccess });
    revalidatePath("/admin");
  } catch (e) {
    console.error("[admin] toggleSubscriberPdfAccess sync", e);
    redirect("/admin?err=sub");
  }
  redirect("/admin?saved=sub");
}
