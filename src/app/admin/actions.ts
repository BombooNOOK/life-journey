"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

import { getViewerEmailFromCookie, normalizeEmail } from "@/lib/auth/viewer";
import { isAdminEmail } from "@/lib/admin/access";
import { prisma } from "@/lib/db";

function clampPdfDownloadLimitPerOrder(raw: string | undefined): number {
  const n = Number.parseInt(String(raw ?? "").trim(), 10);
  if (!Number.isFinite(n)) return 2;
  return Math.min(999, Math.max(0, Math.trunc(n)));
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

export async function updateProfileLimit(formData: FormData) {
  const email = normalizeEmail(formData.get("email")?.toString());
  if (!email) return;
  const viewer = await getViewerEmailFromCookie();
  if (!(await isAdminEmail(viewer))) notFound();
  const profileLimitRaw = formData.get("profileLimit")?.toString();
  const profileLimit = profileLimitRaw === "3" ? 3 : 1;

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
  const duplicates = await prisma.accountSettings.findMany({
    select: { id: true, email: true },
    where: { NOT: { id: merged.id } },
  });
  const targetIds = duplicates
    .filter((d) => normalizeEmail(d.email) === email)
    .map((d) => d.id);
  if (targetIds.length > 0) {
    await prisma.accountSettings.updateMany({
      where: { id: { in: targetIds } },
      data: { profileLimit },
    });
  }
  revalidatePath("/admin");
}

export async function toggleAdminRole(formData: FormData) {
  const email = normalizeEmail(formData.get("email")?.toString());
  if (!email) return;
  const viewer = await getViewerEmailFromCookie();
  if (!(await isAdminEmail(viewer))) notFound();
  const isAdminRaw = formData.get("isAdmin")?.toString();
  const isAdmin = isAdminRaw === "1";
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
  const duplicates = await prisma.accountSettings.findMany({
    select: { id: true, email: true },
    where: { NOT: { id: merged.id } },
  });
  const targetIds = duplicates
    .filter((d) => normalizeEmail(d.email) === email)
    .map((d) => d.id);
  if (targetIds.length > 0) {
    await prisma.accountSettings.updateMany({
      where: { id: { in: targetIds } },
      data: { isAdmin },
    });
  }
  revalidatePath("/admin");
}

export async function updatePdfDownloadLimitPerOrder(formData: FormData) {
  const email = normalizeEmail(formData.get("email")?.toString());
  if (!email) return;
  const viewer = await getViewerEmailFromCookie();
  if (!(await isAdminEmail(viewer))) notFound();
  const pdfDownloadLimitPerOrder = clampPdfDownloadLimitPerOrder(
    formData.get("pdfDownloadLimitPerOrder")?.toString(),
  );

  const merged = await prisma.accountSettings.upsert({
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
  const duplicates = await prisma.accountSettings.findMany({
    select: { id: true, email: true },
    where: { NOT: { id: merged.id } },
  });
  const targetIds = duplicates
    .filter((d) => normalizeEmail(d.email) === email)
    .map((d) => d.id);
  if (targetIds.length > 0) {
    await prisma.accountSettings.updateMany({
      where: { id: { in: targetIds } },
      data: { pdfDownloadLimitPerOrder },
    });
  }
  await syncOrdersPdfDownloadLimitForNormalizedEmail(email, pdfDownloadLimitPerOrder);
  safeRevalidateAdminRelated();
}

export async function toggleSubscriberPdfAccess(formData: FormData) {
  const email = normalizeEmail(formData.get("email")?.toString());
  if (!email) return;
  const viewer = await getViewerEmailFromCookie();
  if (!(await isAdminEmail(viewer))) notFound();
  const subscriberPdfAccess = formData.get("subscriberPdfAccess")?.toString() === "1";
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
  const duplicates = await prisma.accountSettings.findMany({
    select: { id: true, email: true },
    where: { NOT: { id: merged.id } },
  });
  const targetIds = duplicates
    .filter((d) => normalizeEmail(d.email) === email)
    .map((d) => d.id);
  if (targetIds.length > 0) {
    await prisma.accountSettings.updateMany({
      where: { id: { in: targetIds } },
      data: { subscriberPdfAccess },
    });
  }
  revalidatePath("/admin");
}
