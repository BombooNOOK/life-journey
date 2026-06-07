import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

/** BASE未入力の pending を通常一覧から外すまでの日数 */
export const DIARY_BOOK_BINDING_PENDING_STALE_DAYS = 7;

export type DiaryBookBindingPendingRow = {
  id: string;
  status: string;
  baseOrderNumber: string | null;
  createdAt: Date;
};

export function hasBaseOrderNumber(baseOrderNumber: string | null | undefined): boolean {
  return Boolean(baseOrderNumber?.trim());
}

export function stalePendingCutoffDate(
  now = new Date(),
  staleDays = DIARY_BOOK_BINDING_PENDING_STALE_DAYS,
): Date {
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - staleDays);
  return cutoff;
}

export function isStaleUnpaidPending(
  row: Pick<DiaryBookBindingPendingRow, "status" | "baseOrderNumber" | "createdAt">,
  now = new Date(),
): boolean {
  if (row.status !== "pending") return false;
  if (hasBaseOrderNumber(row.baseOrderNumber)) return false;
  return row.createdAt < stalePendingCutoffDate(now);
}

export function canAdminWithdrawPending(
  row: Pick<DiaryBookBindingPendingRow, "status" | "baseOrderNumber">,
): boolean {
  return row.status === "pending" && !hasBaseOrderNumber(row.baseOrderNumber);
}

export const unpaidBaseOrderNumberWhere: Prisma.DiaryBookBindingRequestWhereInput = {
  OR: [{ baseOrderNumber: null }, { baseOrderNumber: "" }],
};

export function staleUnpaidPendingWhere(now = new Date()): Prisma.DiaryBookBindingRequestWhereInput {
  return {
    status: "pending",
    ...unpaidBaseOrderNumberWhere,
    createdAt: { lt: stalePendingCutoffDate(now) },
  };
}

export function visibleUnpaidPendingWhere(now = new Date()): Prisma.DiaryBookBindingRequestWhereInput {
  return {
    status: "pending",
    NOT: staleUnpaidPendingWhere(now),
  };
}

export async function expireStaleUnpaidPendingRequests(now = new Date()): Promise<number> {
  const result = await prisma.diaryBookBindingRequest.updateMany({
    where: staleUnpaidPendingWhere(now),
    data: {
      status: "expired",
      expiredAt: now,
    },
  });
  return result.count;
}

export async function expireStaleUnpaidPendingForScope(
  scope: Prisma.DiaryBookBindingRequestWhereInput,
  now = new Date(),
): Promise<number> {
  const result = await prisma.diaryBookBindingRequest.updateMany({
    where: {
      AND: [scope, staleUnpaidPendingWhere(now)],
    },
    data: {
      status: "expired",
      expiredAt: now,
    },
  });
  return result.count;
}

export async function resolveActivePendingRequest<T extends DiaryBookBindingPendingRow>(
  row: T | null,
  now = new Date(),
): Promise<T | null> {
  if (!row) return null;
  if (!isStaleUnpaidPending(row, now)) return row;

  await prisma.diaryBookBindingRequest.update({
    where: { id: row.id },
    data: {
      status: "expired",
      expiredAt: now,
    },
  });
  return null;
}
