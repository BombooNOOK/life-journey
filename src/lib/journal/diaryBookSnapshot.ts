import { prisma } from "@/lib/db";
import { isEntryIncludedInDiaryBook } from "@/lib/journal/includeInBook";
import {
  journalEntryCreatedAtRangeForBookPeriod,
  parseDiaryBookDateRange,
} from "@/lib/journal/diaryBookPeriod";

/** 日記ブックに反映済みの記事か（includeInBook ON かつ最終更新が book.updatedAt 以前） */
export function entryVisibleInDiaryBookSnapshot(
  entry: {
    createdAt: Date | string;
    updatedAt?: Date | string;
    includeInBook?: boolean | null;
  },
  bookUpdatedAt: Date,
): boolean {
  if (!isEntryIncludedInDiaryBook(entry)) return false;
  const created = new Date(entry.createdAt);
  const updated = entry.updatedAt ? new Date(entry.updatedAt) : created;
  const asOf = bookUpdatedAt.getTime();
  return created.getTime() <= asOf && updated.getTime() <= asOf;
}

export async function countDiaryBookSnapshotEntries(params: {
  email: string;
  profileId: string;
  startDate: string;
  endDate: string;
  bookUpdatedAt: Date;
}): Promise<number> {
  const range = parseDiaryBookDateRange(params.startDate, params.endDate);
  if (!range) return 0;

  const createdAt = journalEntryCreatedAtRangeForBookPeriod(range);
  const asOf = params.bookUpdatedAt;
  const periodEndLte =
    asOf.getTime() < createdAt.lte.getTime() ? asOf : createdAt.lte;

  return prisma.journalEntry.count({
    where: {
      email: params.email,
      profileId: params.profileId,
      createdAt: {
        gte: createdAt.gte,
        lte: periodEndLte,
      },
      updatedAt: { lte: asOf },
      includeInBook: true,
    },
  });
}

/** 期間内に、日記ブックの最終更新より新しい変更があるか */
export async function diaryBookNeedsContentRefresh(params: {
  email: string;
  profileId: string;
  startDate: string;
  endDate: string;
  bookUpdatedAt: Date;
}): Promise<boolean> {
  const range = parseDiaryBookDateRange(params.startDate, params.endDate);
  if (!range) return false;

  const createdAt = journalEntryCreatedAtRangeForBookPeriod(range);
  const asOf = params.bookUpdatedAt;

  const pending = await prisma.journalEntry.findFirst({
    where: {
      email: params.email,
      profileId: params.profileId,
      createdAt,
      OR: [{ createdAt: { gt: asOf } }, { updatedAt: { gt: asOf } }],
    },
    select: { id: true },
  });

  return pending != null;
}

export async function refreshDiaryBookContent(params: {
  bookId: string;
  viewerEmail: string;
}): Promise<
  | { ok: true; entryCount: number; updatedAt: string }
  | { ok: false; status: number; error: string; code: string }
> {
  const row = await prisma.diaryBook.findFirst({
    where: { id: params.bookId.trim(), email: params.viewerEmail },
  });
  if (!row) {
    return { ok: false, status: 404, error: "日記ブックが見つかりません。", code: "NOT_FOUND" };
  }

  const updated = await prisma.diaryBook.update({
    where: { id: row.id },
    data: { updatedAt: new Date() },
  });

  const entryCount = await countDiaryBookSnapshotEntries({
    email: row.email,
    profileId: row.profileId,
    startDate: row.startDate,
    endDate: row.endDate,
    bookUpdatedAt: updated.updatedAt,
  });

  return {
    ok: true,
    entryCount,
    updatedAt: updated.updatedAt.toISOString(),
  };
}
