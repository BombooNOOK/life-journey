import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { ashiatoEntryBodyLengthFlag } from "@/lib/journal/ashiatoEntryRender";
import {
  journalEntryLayoutLengthFlag,
  type JournalContentLengthFlag,
} from "@/lib/journal/contentFontMode";
import {
  journalEntryCreatedAtRangeForBookPeriod,
  parseDiaryBookDateRange,
} from "@/lib/journal/diaryBookPeriod";
import {
  diaryBookTagScopeFromRow,
  hasDiaryBookTagScope,
  type DiaryBookTagScope,
} from "@/lib/journal/diaryBookTagFilter";
import { matchDiaryBookTagFilter, stripTagsFromContent } from "@/lib/journal/diaryTags";
import { journalEntryDateToIsoDateInput } from "@/lib/journal/referenceDateParts";

export type DiaryBookIncludePickerEntryDto = {
  id: string;
  createdAt: string;
  mood: string;
  contentExcerpt: string;
  hasPhoto: boolean;
  includeInBook: boolean;
  lengthFlag: JournalContentLengthFlag;
};

const EXCERPT_MAX = 36;

export function journalEntryContentExcerpt(content: string, maxLen = EXCERPT_MAX): string {
  const normalized = stripTagsFromContent(content).replace(/\s+/g, " ").trim();
  if (!normalized) return "（本文なし）";
  if (normalized.length <= maxLen) return normalized;
  return `${normalized.slice(0, maxLen)}…`;
}

export function diaryBookIncludePickerMonthKey(createdAt: string | Date): string {
  const iso = journalEntryDateToIsoDateInput(new Date(createdAt));
  const [y, m] = iso.split("-");
  return `${y}-${m}`;
}

export function diaryBookIncludePickerMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  return `${y}年${m}月`;
}

export function diaryBookIncludePickerDateLabel(createdAt: string | Date): string {
  const iso = journalEntryDateToIsoDateInput(new Date(createdAt));
  const [, m, d] = iso.split("-").map(Number);
  return `${m}月${d}日`;
}

export function groupDiaryBookIncludePickerEntriesByMonth(
  entries: DiaryBookIncludePickerEntryDto[],
): { key: string; label: string; entries: DiaryBookIncludePickerEntryDto[] }[] {
  const map = new Map<string, DiaryBookIncludePickerEntryDto[]>();
  for (const entry of entries) {
    const key = diaryBookIncludePickerMonthKey(entry.createdAt);
    const bucket = map.get(key);
    if (bucket) bucket.push(entry);
    else map.set(key, [entry]);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, monthEntries]) => ({
      key,
      label: diaryBookIncludePickerMonthLabel(key),
      entries: monthEntries,
    }));
}

type IncludePickerRow = {
  id: string;
  createdAt: Date;
  mood: string;
  content: string;
  includeInBook: boolean;
  contentFontMode: string;
  hasPhoto: boolean;
};

/**
 * 月別一覧用。photoDataUrl / photoBlob は読まない。
 * 期間リストは件数上限があるため content 全文を取り、改行込みのはみ出し判定に使う。
 */
export async function listJournalEntriesForDiaryBookIncludePicker(params: {
  email: string;
  profileId: string;
  startDate: string;
  endDate: string;
  /** あしあとブックのページテンプレ。指定時は枠容量ベースの lengthFlag */
  pageTemplate?: string | null;
}): Promise<DiaryBookIncludePickerEntryDto[]> {
  const range = parseDiaryBookDateRange(params.startDate, params.endDate);
  if (!range) return [];

  const createdAt = journalEntryCreatedAtRangeForBookPeriod(range);
  const rows = await prisma.$queryRaw<IncludePickerRow[]>(Prisma.sql`
    SELECT
      id,
      "createdAt",
      mood,
      content,
      "includeInBook",
      "contentFontMode",
      (
        ("photoBlobUrl" IS NOT NULL AND btrim("photoBlobUrl") <> '')
        OR ("photoDataUrl" IS NOT NULL AND btrim("photoDataUrl") <> '')
      ) AS "hasPhoto"
    FROM "JournalEntry"
    WHERE email = ${params.email}
      AND "profileId" = ${params.profileId}
      AND "createdAt" >= ${createdAt.gte}
      AND "createdAt" <= ${createdAt.lte}
    ORDER BY "createdAt" ASC
  `);

  const pageTemplate = params.pageTemplate?.trim() || null;

  return rows.map((row) => {
    const content = row.content ?? "";
    return {
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      mood: row.mood,
      contentExcerpt: journalEntryContentExcerpt(content),
      hasPhoto: Boolean(row.hasPhoto),
      includeInBook: row.includeInBook !== false,
      lengthFlag: pageTemplate
        ? ashiatoEntryBodyLengthFlag({
            content,
            contentFontMode: row.contentFontMode,
            pageTemplate,
          })
        : journalEntryLayoutLengthFlag(row.contentFontMode, content),
    };
  });
}

/** 期間内のあしあとを末尾タグ条件で絞り込む（includeInBook の件数も返す） */
export async function countDiaryBookPeriodEntriesWithTagScope(params: {
  email: string;
  profileId: string;
  startDate: string;
  endDate: string;
  tagScope?: DiaryBookTagScope;
}): Promise<{ matchingCount: number; includedCount: number }> {
  const range = parseDiaryBookDateRange(params.startDate, params.endDate);
  if (!range) return { matchingCount: 0, includedCount: 0 };

  const scope = params.tagScope ?? { tagFilter: "", tagFilterMode: "AND" };
  const createdAt = journalEntryCreatedAtRangeForBookPeriod(range);
  const rows = await prisma.journalEntry.findMany({
    where: {
      email: params.email,
      profileId: params.profileId,
      createdAt,
    },
    select: { content: true, includeInBook: true },
  });

  const filtered = hasDiaryBookTagScope(scope)
    ? rows.filter((row) =>
        matchDiaryBookTagFilter(row.content, scope.tagFilter, scope.tagFilterMode),
      )
    : rows;

  return {
    matchingCount: filtered.length,
    includedCount: filtered.filter((row) => row.includeInBook !== false).length,
  };
}

/** @deprecated {@link countDiaryBookPeriodEntriesWithTagScope} を使用 */
export async function countDiaryBookPeriodEntriesWithOptionalTag(params: {
  email: string;
  profileId: string;
  startDate: string;
  endDate: string;
  tag?: string;
}): Promise<{ totalCount: number; includedCount: number }> {
  const scope = diaryBookTagScopeFromRow({
    tagFilter: params.tag?.trim() ?? "",
    tagFilterMode: "OR",
  });
  const counts = await countDiaryBookPeriodEntriesWithTagScope({
    email: params.email,
    profileId: params.profileId,
    startDate: params.startDate,
    endDate: params.endDate,
    tagScope: scope,
  });
  return { totalCount: counts.matchingCount, includedCount: counts.includedCount };
}

/** ピッカー一覧を末尾タグ条件で絞り込む */
export async function filterDiaryBookPickerEntriesByTagScope(params: {
  email: string;
  profileId: string;
  entries: DiaryBookIncludePickerEntryDto[];
  tagScope?: DiaryBookTagScope;
}): Promise<DiaryBookIncludePickerEntryDto[]> {
  const scope = params.tagScope ?? { tagFilter: "", tagFilterMode: "AND" };
  if (!hasDiaryBookTagScope(scope) || params.entries.length === 0) return params.entries;

  const rows = await prisma.journalEntry.findMany({
    where: {
      email: params.email,
      profileId: params.profileId,
      id: { in: params.entries.map((entry) => entry.id) },
    },
    select: { id: true, content: true },
  });

  const matchingIds = new Set(
    rows
      .filter((row) =>
        matchDiaryBookTagFilter(row.content, scope.tagFilter, scope.tagFilterMode),
      )
      .map((row) => row.id),
  );
  return params.entries.filter((entry) => matchingIds.has(entry.id));
}

/** @deprecated {@link filterDiaryBookPickerEntriesByTagScope} を使用 */
export async function filterDiaryBookPickerEntriesByTag(params: {
  email: string;
  profileId: string;
  entries: DiaryBookIncludePickerEntryDto[];
  tag?: string;
}): Promise<DiaryBookIncludePickerEntryDto[]> {
  return filterDiaryBookPickerEntriesByTagScope({
    email: params.email,
    profileId: params.profileId,
    entries: params.entries,
    tagScope: diaryBookTagScopeFromRow({
      tagFilter: params.tag?.trim() ?? "",
      tagFilterMode: "OR",
    }),
  });
}
