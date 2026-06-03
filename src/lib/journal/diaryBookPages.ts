import type { BoundDiaryEntry } from "@/components/journal/DiaryYearBoundPages";
import { filterEntriesForDiaryBook } from "@/lib/journal/includeInBook";
import { parseDiaryBookDateRange } from "@/lib/journal/diaryBookPeriod";

export type DiaryBookMonthKey = { year: number; monthIndex: number };

export type DiaryBookPageKind =
  | { kind: "cover" }
  | { kind: "inside-cover" }
  | { kind: "inside-cover-back-illustration" }
  | { kind: "month-index"; monthIndex: number; calendarYear: number }
  | { kind: "month-illustration"; monthIndex: number; calendarYear: number }
  /** 日記本文枚数の見開き調整（③・全月共通ファイル） */
  | { kind: "month-body-odd-adjustment"; monthIndex: number; calendarYear: number }
  | { kind: "entry"; entry: BoundDiaryEntry; entryIndex: number }
  /** 自由記入欄（見開き左） */
  | { kind: "free-writing"; spreadSide: "left" }
  /** 自由記入欄（見開き右） */
  | { kind: "free-writing"; spreadSide: "right" }
  /** 裏表紙直前（全員必須・旧フクロウ調整イラスト） */
  | { kind: "pre-back-cover-illustration" }
  | { kind: "back" };

/** startDate〜endDate（含む）に含まれる各暦月 */
export function monthsInDiaryBookPeriod(startDate: string, endDate: string): DiaryBookMonthKey[] {
  const range = parseDiaryBookDateRange(startDate, endDate);
  if (!range) return [];

  const [startY, startM] = range.startDate.split("-").map(Number);
  const [endY, endM] = range.endDate.split("-").map(Number);

  const result: DiaryBookMonthKey[] = [];
  let y = startY;
  let m = startM;
  while (y < endY || (y === endY && m <= endM)) {
    result.push({ year: y, monthIndex: m - 1 });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return result;
}

export function diaryBookDisplayYear(startDate: string): number {
  const y = Number(startDate.slice(0, 4));
  return Number.isFinite(y) ? y : new Date().getFullYear();
}

export function diaryBookEntriesInMonth(
  entries: BoundDiaryEntry[],
  year: number,
  monthIndex: number,
): BoundDiaryEntry[] {
  return entries.filter((e) => {
    const d = new Date(e.createdAt);
    return d.getFullYear() === year && d.getMonth() === monthIndex;
  });
}

function isSameMonth(a: DiaryBookMonthKey, b: DiaryBookMonthKey): boolean {
  return a.year === b.year && a.monthIndex === b.monthIndex;
}

/**
 * ③ 調整イラストを足すか。
 * - 最終月以外: 日記本文が奇数枚
 * - 最終月: 日記本文が偶数枚（自由記入2P＋裏表紙前1P により奇数側は不要）
 */
export function monthNeedsBodyOddAdjustment(
  entryCount: number,
  isLastMonth: boolean,
): boolean {
  if (entryCount <= 0) return false;
  const isOdd = entryCount % 2 === 1;
  return isLastMonth ? !isOdd : isOdd;
}

/**
 * 製本直送向けページ配列。
 *
 * 各月: 索引（右）→ 足跡 → 日記… →（必要なら③）
 * 末尾: 自由記入（見開き2P）→ 裏表紙直前イラスト（全員）→ 裏表紙
 */
export function buildBoundDiaryBookPages(
  entries: BoundDiaryEntry[],
  startDate: string,
  endDate: string,
): DiaryBookPageKind[] {
  const bookEntries = filterEntriesForDiaryBook(entries);
  const months = monthsInDiaryBookPeriod(startDate, endDate);
  const lastMonth = months[months.length - 1];

  const pages: DiaryBookPageKind[] = [
    { kind: "cover" },
    { kind: "inside-cover" },
    { kind: "inside-cover-back-illustration" },
  ];

  let entryIndex = 0;
  for (const month of months) {
    const { year, monthIndex } = month;
    const isLastMonth = lastMonth != null && isSameMonth(month, lastMonth);

    pages.push({ kind: "month-index", monthIndex, calendarYear: year });
    pages.push({ kind: "month-illustration", monthIndex, calendarYear: year });

    const monthEntries = diaryBookEntriesInMonth(bookEntries, year, monthIndex);
    for (const entry of monthEntries) {
      pages.push({ kind: "entry", entry, entryIndex });
      entryIndex += 1;
    }

    if (monthNeedsBodyOddAdjustment(monthEntries.length, isLastMonth)) {
      pages.push({
        kind: "month-body-odd-adjustment",
        monthIndex,
        calendarYear: year,
      });
    }
  }

  pages.push({ kind: "free-writing", spreadSide: "left" });
  pages.push({ kind: "free-writing", spreadSide: "right" });
  pages.push({ kind: "pre-back-cover-illustration" });
  pages.push({ kind: "back" });

  return pages;
}

export function boundDiaryBookPageLabel(
  page: DiaryBookPageKind,
  displayYear: number,
  entryTotal: number,
): string {
  switch (page.kind) {
    case "cover":
      return "表紙";
    case "inside-cover":
      return "中表紙";
    case "inside-cover-back-illustration":
      return "中表紙裏";
    case "month-index": {
      const y = page.calendarYear ?? displayYear;
      return `${y}年${page.monthIndex + 1}月 · 索引`;
    }
    case "month-illustration": {
      const y = page.calendarYear ?? displayYear;
      return `${y}年${page.monthIndex + 1}月 · 足跡`;
    }
    case "month-body-odd-adjustment": {
      const y = page.calendarYear ?? displayYear;
      return `${y}年${page.monthIndex + 1}月 · 調整`;
    }
    case "free-writing":
      return page.spreadSide === "left" ? "自由記入 · 左" : "自由記入 · 右";
    case "pre-back-cover-illustration":
      return "裏表紙前";
    case "entry":
      return `記録 ${page.entryIndex + 1} / ${entryTotal}`;
    case "back":
      return "裏表紙";
  }
}
