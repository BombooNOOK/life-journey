import type { BirthDateParts } from "@/lib/numerology/types";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * 注文の生年月日を解釈する。
 * - `YYYY-MM-DD`（月日のゼロ埋めなしも可）
 * - ISO の先頭日付部分（`...T...` の前）
 * - 文字列が無理なときは DB の birthYear / birthMonth / birthDay をフォールバック
 */
export function parseOrderBirthDateParts(
  iso: string | null | undefined,
  fallback?: { birthYear: number; birthMonth: number; birthDay: number } | null,
): BirthDateParts | null {
  if (iso != null && String(iso).trim() !== "") {
    const s = String(iso).trim();
    const head = s.includes("T")
      ? s.slice(0, s.indexOf("T"))
      : (s.split(/\s+/)[0] ?? s);
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(head);
    if (m) {
      const year = Number(m[1]);
      const month = Number(m[2]);
      const day = Number(m[3]);
      if (
        Number.isFinite(year) &&
        year >= 1 &&
        year <= 9999 &&
        month >= 1 &&
        month <= 12 &&
        day >= 1 &&
        day <= 31
      ) {
        return { year, month, day };
      }
    }
  }
  const f = fallback;
  if (
    f &&
    Number.isFinite(f.birthYear) &&
    Number.isFinite(f.birthMonth) &&
    Number.isFinite(f.birthDay)
  ) {
    const year = Math.trunc(f.birthYear);
    const month = Math.trunc(f.birthMonth);
    const day = Math.trunc(f.birthDay);
    if (year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { year, month, day };
    }
  }
  return null;
}

/** 厳密 YYYY-MM-DD のみ（ゼロ埋め必須）。後方互換用 */
export function parseIsoBirthDateParts(iso: string): BirthDateParts | null {
  return parseOrderBirthDateParts(iso, null);
}

export function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  const d = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return d[month - 1] ?? 0;
}

/** ローカル日付として妥当なら YYYY-MM-DD を返す */
export function toIsoDateString(year: number, month: number, day: number): string {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth(year, month)
  ) {
    throw new Error("生年月日の組み合わせが不正です。");
  }
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    throw new Error("存在しない日付です。");
  }
  return `${year}-${pad2(month)}-${pad2(day)}`;
}
