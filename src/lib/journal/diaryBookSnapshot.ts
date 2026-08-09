import { prisma } from "@/lib/db";
import { isEntryIncludedInDiaryBook } from "@/lib/journal/includeInBook";
import {
  journalEntryCreatedAtRangeForBookPeriod,
  parseDiaryBookDateRange,
} from "@/lib/journal/diaryBookPeriod";
import {
  diaryBookTagScopeFromRow,
  hasDiaryBookTagScope,
  type DiaryBookTagScope,
} from "@/lib/journal/diaryBookTagFilter";
import { matchDiaryBookTagFilter } from "@/lib/journal/diaryTags";

/** 記事の最終変更時刻（DB の updatedAt。createdAt は記録日 UTC 正午のため比較に使わない） */
export function journalEntryLastChangedAt(entry: {
  createdAt: Date | string;
  updatedAt?: Date | string;
}): Date {
  return entry.updatedAt ? new Date(entry.updatedAt) : new Date(entry.createdAt);
}

/** 日記ブック更新後に、記事側に未反映の変更があるか */
export function journalEntryChangedAfterDiaryBookRefresh(
  entry: {
    createdAt: Date | string;
    updatedAt?: Date | string;
  },
  bookUpdatedAt: Date,
): boolean {
  return journalEntryLastChangedAt(entry).getTime() > bookUpdatedAt.getTime();
}

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
  return !journalEntryChangedAfterDiaryBookRefresh(entry, bookUpdatedAt);
}

export async function countDiaryBookSnapshotEntries(params: {
  email: string;
  profileId: string;
  startDate: string;
  endDate: string;
  bookUpdatedAt: Date;
  tagScope?: DiaryBookTagScope;
}): Promise<number> {
  const range = parseDiaryBookDateRange(params.startDate, params.endDate);
  if (!range) return 0;

  const createdAt = journalEntryCreatedAtRangeForBookPeriod(range);
  const asOf = params.bookUpdatedAt;
  const periodEndLte =
    asOf.getTime() < createdAt.lte.getTime() ? asOf : createdAt.lte;
  const scope = params.tagScope ?? { tagFilter: "", tagFilterMode: "AND" };

  const rows = await prisma.journalEntry.findMany({
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
    select: { content: true },
  });

  if (!hasDiaryBookTagScope(scope)) return rows.length;

  return rows.filter((row) =>
    matchDiaryBookTagFilter(row.content, scope.tagFilter, scope.tagFilterMode),
  ).length;
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
      updatedAt: { gt: asOf },
    },
    select: { id: true },
  });

  return pending != null;
}

export async function refreshDiaryBookContent(params: {
  bookId: string;
  viewerEmail: string;
}): Promise<
  | { ok: true; entryCount: number; updatedAt: string; needsContentRefresh: false }
  | { ok: false; status: number; error: string; code: string }
> {
  const row = await prisma.diaryBook.findFirst({
    where: { id: params.bookId.trim(), email: params.viewerEmail },
  });
  if (!row) {
    return { ok: false, status: 404, error: "あしあとブックが見つかりません。", code: "NOT_FOUND" };
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
    tagScope: diaryBookTagScopeFromRow(row),
  });

  return {
    ok: true,
    entryCount,
    updatedAt: updated.updatedAt.toISOString(),
    needsContentRefresh: false,
  };
}
