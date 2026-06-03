import { prisma } from "@/lib/db";
import {
  journalEntryLayoutLengthFlag,
  type JournalContentLengthFlag,
} from "@/lib/journal/contentFontMode";
import {
  journalEntryCreatedAtRangeForBookPeriod,
  parseDiaryBookDateRange,
} from "@/lib/journal/diaryBookPeriod";
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
  const normalized = content.replace(/\s+/g, " ").trim();
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

export async function listJournalEntriesForDiaryBookIncludePicker(params: {
  email: string;
  profileId: string;
  startDate: string;
  endDate: string;
}): Promise<DiaryBookIncludePickerEntryDto[]> {
  const range = parseDiaryBookDateRange(params.startDate, params.endDate);
  if (!range) return [];

  const createdAt = journalEntryCreatedAtRangeForBookPeriod(range);
  const rows = await prisma.journalEntry.findMany({
    where: {
      email: params.email,
      profileId: params.profileId,
      createdAt,
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      createdAt: true,
      mood: true,
      content: true,
      photoDataUrl: true,
      includeInBook: true,
      contentFontMode: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    mood: row.mood,
    contentExcerpt: journalEntryContentExcerpt(row.content),
    hasPhoto: Boolean(row.photoDataUrl?.trim()),
    includeInBook: row.includeInBook !== false,
    lengthFlag: journalEntryLayoutLengthFlag(row.contentFontMode, row.content),
  }));
}
