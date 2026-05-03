"use server";

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

async function syncDuplicateAccountRowsForNormalizedEmail(
  mergedId: string,
  email: string,
  data: Record<string, unknown>,
): Promise<void> {
  const duplicates = await prisma.accountSettings.findMany({
    select: { id: true, email: true },
    where: { NOT: { id: mergedId } },
  });
  const targetIds = duplicates
    .filter((d) => normalizeEmail(d.email) === email)
    .map((d) => d.id);
  if (targetIds.length > 0) {
    await prisma.accountSettings.updateMany({
      where: { id: { in: targetIds } },
      data: data as { profileLimit?: number; isAdmin?: boolean; pdfDownloadLimitPerOrder?: number; subscriberPdfAccess?: boolean },
    });
  }
}

export async function updateProfileLimit(formData: FormData) {
  await requireAdminOrRedirect();
  const email = normalizeEmail(formData.get("email")?.toString());
  if (!email) redirect("/admin");

  const profileLimitRaw = formData.get("profileLimit")?.toString();
  const profileLimit = profileLimitRaw === "3" ? 3 : 1;

  try {
    const merged = await prisma.accountSettings.upsert({
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
    await syncDuplicateAccountRowsForNormalizedEmail(merged.id, email, { profileLimit });
    revalidatePath("/admin");
  } catch (e) {
    console.error("[admin] updateProfileLimit", e);
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

  try {
    const merged = await prisma.accountSettings.upsert({
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
    await syncDuplicateAccountRowsForNormalizedEmail(merged.id, email, { isAdmin });
    revalidatePath("/admin");
  } catch (e) {
    console.error("[admin] toggleAdminRole", e);
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
  } catch (e) {
    console.warn("[admin] accountSettings upsert failed, using fallback:", e);
    const hit = await prisma.accountSettings.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
    if (hit) {
      return prisma.accountSettings.update({
        where: { id: hit.id },
        data: { pdfDownloadLimitPerOrder },
      });
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

  try {
    const merged = await prisma.accountSettings.upsert({
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
    await syncDuplicateAccountRowsForNormalizedEmail(merged.id, email, { subscriberPdfAccess });
    revalidatePath("/admin");
  } catch (e) {
    console.error("[admin] toggleSubscriberPdfAccess", e);
    redirect("/admin?err=sub");
  }
  redirect("/admin?saved=sub");
}
