import { Prisma } from "@prisma/client";

import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";

export { formatAccountMemberNumber } from "@/lib/account/accountMemberNumberFormat";

const ASSIGN_MAX_ATTEMPTS = 8;

async function allocateNextMemberNumber(): Promise<number> {
  const latest = await prisma.accountSettings.findFirst({
    where: { memberNumber: { not: null } },
    orderBy: { memberNumber: "desc" },
    select: { memberNumber: true },
  });
  const next = (latest?.memberNumber ?? 0) + 1;
  return Math.max(1, next);
}

/** AccountSettings に会員番号が無ければ採番して返す */
export async function ensureAccountMemberNumber(emailRaw: string): Promise<number | null> {
  const email = normalizeEmail(emailRaw);
  if (!email) return null;

  const existing = await prisma.accountSettings.findUnique({
    where: { email },
    select: { id: true, memberNumber: true },
  });
  if (existing?.memberNumber != null) return existing.memberNumber;

  for (let attempt = 0; attempt < ASSIGN_MAX_ATTEMPTS; attempt++) {
    const memberNumber = await allocateNextMemberNumber();
    try {
      if (existing) {
        const updated = await prisma.accountSettings.update({
          where: { id: existing.id },
          data: { memberNumber },
          select: { memberNumber: true },
        });
        return updated.memberNumber;
      }
      const created = await prisma.accountSettings.create({
        data: {
          email,
          memberNumber,
          profileLimit: 1,
          isAdmin: false,
          isMonitor: false,
          subscriberPdfAccess: false,
          pdfDownloadLimitPerOrder: 2,
        },
        select: { memberNumber: true },
      });
      return created.memberNumber;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        const retry = await prisma.accountSettings.findUnique({
          where: { email },
          select: { memberNumber: true },
        });
        if (retry?.memberNumber != null) return retry.memberNumber;
        continue;
      }
      throw e;
    }
  }
  return null;
}

/** 一覧表示前に、番号未設定の AccountSettings をまとめて埋める */
export async function backfillMissingMemberNumbers(limit = 500): Promise<number> {
  const missing = await prisma.accountSettings.findMany({
    where: { memberNumber: null },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true, email: true },
    take: limit,
  });
  let filled = 0;
  for (const row of missing) {
    const n = await ensureAccountMemberNumber(row.email);
    if (n != null) filled += 1;
  }
  return filled;
}
