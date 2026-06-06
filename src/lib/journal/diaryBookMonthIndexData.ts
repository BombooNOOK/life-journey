import type { BoundDiaryEntry } from "@/components/journal/DiaryYearBoundPages";
import { diaryBookEntriesInMonth } from "@/lib/journal/diaryBookPages";
import { phraseForMonth } from "@/lib/journal/diaryPhrases";
import { DIARY_BOOK_DESIGN_WIDTH_PX } from "@/lib/journal/diaryBookPrintPdfLayout";
import { isEntryIncludedInDiaryBook } from "@/lib/journal/includeInBook";
import { getMoodMeta } from "@/lib/journal/meta";

/** DiaryBoundMonthCalendarPage（bookReader）と同一のレイアウト定数（724×1024 基準） */
export const DIARY_BOOK_READER_PAGE_BG = "#fdfaf4";
export const DIARY_BOOK_READER_WEEK_ROWS = 6;
export const DIARY_BOOK_READER_INDEX_HEADER_HEIGHT_PX = 341;
export const DIARY_BOOK_READER_PAGE_HEIGHT_PX = 1024;
export const DIARY_BOOK_READER_LOWER_BLOCK_BOTTOM_INSET_PX = Math.round(
  DIARY_BOOK_READER_PAGE_HEIGHT_PX * 0.05,
);
export const DIARY_BOOK_READER_TITLE_TO_CALENDAR_GAP_PX = 72;
export const DIARY_BOOK_READER_INDEX_TITLE_PADDING_TOP_PX = 178;
export const DIARY_BOOK_READER_HORIZONTAL_PADDING_PX = 16;
export const DIARY_BOOK_READER_CALENDAR_CELL_GAP_PX = 6;
export const DIARY_BOOK_READER_WEEKDAY_CALENDAR_GAP_PX = 10;
export const DIARY_BOOK_READER_CALENDAR_SUMMARY_GAP_PX = 12;
export const DIARY_BOOK_READER_CALENDAR_GRID_MIN_HEIGHT_PX = 384;
export const DIARY_BOOK_READER_SUMMARY_BG = "#f2f0e8";
export const DIARY_BOOK_READER_SUMMARY_BORDER = "#c9d2bc";

export const DIARY_BOOK_READER_WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export type DiaryBookMonthIndexDayCell = {
  day: number | null;
  hasEntry: boolean;
  stampEntry: BoundDiaryEntry | null;
  extraEntryCount: number;
  isToday: boolean;
};

export type DiaryBookMonthIndexViewModel = {
  year: number;
  monthIndex: number;
  month: number;
  cells: DiaryBookMonthIndexDayCell[];
  daysWithEntryCount: number;
  monthEntryCount: number;
  hasMultipleEntriesSameDay: boolean;
  topMoodId: string;
  topMoodEmoji: string;
  topMoodLabel: string;
  monthPhrase: string;
};

function dominantMoodId(entries: BoundDiaryEntry[]): string {
  if (entries.length === 0) return "calm";
  const moodCount = new Map<string, number>();
  for (const entry of entries) {
    moodCount.set(entry.mood, (moodCount.get(entry.mood) ?? 0) + 1);
  }
  let topMoodId = "calm";
  let topCount = -1;
  for (const [moodId, count] of moodCount) {
    if (count > topCount) {
      topMoodId = moodId;
      topCount = count;
    }
  }
  return topMoodId;
}

export function buildDiaryBookMonthIndexViewModel(
  year: number,
  monthIndex: number,
  entries: BoundDiaryEntry[],
): DiaryBookMonthIndexViewModel {
  const monthEntriesAll = diaryBookEntriesInMonth(entries, year, monthIndex);
  const monthEntries = monthEntriesAll.filter(isEntryIncludedInDiaryBook);

  const daysWithEntry = new Set<number>();
  const entryCountByDay = new Map<number, number>();
  const latestByDay = new Map<number, BoundDiaryEntry>();

  for (const entry of monthEntries) {
    const day = new Date(entry.createdAt).getDate();
    daysWithEntry.add(day);
    entryCountByDay.set(day, (entryCountByDay.get(day) ?? 0) + 1);
    if (!latestByDay.has(day)) latestByDay.set(day, entry);
  }

  const topMoodId = dominantMoodId(monthEntries);
  const topMood =
    monthEntries.length === 0
      ? { emoji: "", label: "まだ記録がありません" }
      : getMoodMeta(topMoodId);

  const startWeekday = new Date(year, monthIndex, 1).getDay();
  const monthDays = new Date(year, monthIndex + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === monthIndex;

  const rawCells: Array<number | null> = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: monthDays }, (_, i) => i + 1),
  ];
  while (rawCells.length % 7 !== 0) rawCells.push(null);
  while (rawCells.length < DIARY_BOOK_READER_WEEK_ROWS * 7) rawCells.push(null);

  const cells: DiaryBookMonthIndexDayCell[] = rawCells.map((day) => {
    if (day === null) {
      return {
        day: null,
        hasEntry: false,
        stampEntry: null,
        extraEntryCount: 0,
        isToday: false,
      };
    }
    const entryCount = entryCountByDay.get(day) ?? 0;
    return {
      day,
      hasEntry: daysWithEntry.has(day),
      stampEntry: latestByDay.get(day) ?? null,
      extraEntryCount: entryCount > 1 ? entryCount - 1 : 0,
      isToday: isCurrentMonth && day === today.getDate(),
    };
  });

  return {
    year,
    monthIndex,
    month: monthIndex + 1,
    cells,
    daysWithEntryCount: daysWithEntry.size,
    monthEntryCount: monthEntries.length,
    hasMultipleEntriesSameDay: monthEntries.length > daysWithEntry.size,
    topMoodId,
    topMoodEmoji: topMood.emoji,
    topMoodLabel: topMood.label,
    monthPhrase: phraseForMonth(monthEntries.length, topMoodId),
  };
}

/** カレンダー1セルの幅（724 基準 px） */
export function diaryBookMonthIndexCellWidthPx(): number {
  const contentWidth = DIARY_BOOK_DESIGN_WIDTH_PX - DIARY_BOOK_READER_HORIZONTAL_PADDING_PX * 2;
  const gaps = DIARY_BOOK_READER_CALENDAR_CELL_GAP_PX * 6;
  return (contentWidth - gaps) / 7;
}

/** カレンダー1行の高さ（6週・gap 込みで min 384px） */
export function diaryBookMonthIndexCellHeightPx(): number {
  const gaps = DIARY_BOOK_READER_CALENDAR_CELL_GAP_PX * (DIARY_BOOK_READER_WEEK_ROWS - 1);
  return (DIARY_BOOK_READER_CALENDAR_GRID_MIN_HEIGHT_PX - gaps) / DIARY_BOOK_READER_WEEK_ROWS;
}
