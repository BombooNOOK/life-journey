import { reducePersonalCycleNumber } from "./personalYearMonth";

/** 月・日を 2 桁（01〜12 / 01〜31）の十の位・一の位に分ける */
export function splitTwoDigitParts(value: number): { tens: number; ones: number } {
  const v = Math.max(0, Math.floor(value));
  return { tens: Math.floor(v / 10), ones: v % 10 };
}

/** 2 桁の各桁を分けて足す（24 → 2+4、6 → 0+6） */
export function sumTwoDigitParts(value: number): number {
  const { tens, ones } = splitTwoDigitParts(value);
  return tens + ones;
}

export function formatTwoDigitPartsExpression(value: number): string {
  const { tens, ones } = splitTwoDigitParts(value);
  if (tens === 0) return String(ones);
  return `${tens} + ${ones}`;
}

/**
 * ユニバーサルイヤー = 対象の西暦年を 1 桁まで縮約（11/22/33 は残さない）
 * 例: 2026 → 2+0+2+6 = 10 → 1
 */
export function universalYearNumber(calendarYear: number): number {
  return reducePersonalCycleNumber(Math.floor(calendarYear));
}

/**
 * ユニバーサルマンス = ユニバーサルイヤー + 月（2 桁の各桁）→ 1 桁まで縮約
 * 例: 6 月 → 0+6、10 月 → 1+0
 */
export function universalMonthNumber(
  universalYearDigit: number,
  calendarMonth: number,
): number {
  const { tens, ones } = splitTwoDigitParts(calendarMonth);
  return reducePersonalCycleNumber(universalYearDigit + tens + ones);
}

/**
 * ユニバーサルデイ = ユニバーサルマンス + 日（2 桁の各桁）→ 1 桁まで縮約
 * 例: 24 日 → 7+2+4=13 → 4（24 を一括で足さない）
 */
export function universalDayNumber(
  universalMonthDigit: number,
  calendarDay: number,
): number {
  const { tens, ones } = splitTwoDigitParts(calendarDay);
  return reducePersonalCycleNumber(universalMonthDigit + tens + ones);
}

export type UniversalCycleNumbers = {
  universalYear: number;
  universalMonth: number;
  universalDay: number;
};

export function universalCycleNumbersFromYMD(
  calendarYear: number,
  calendarMonth: number,
  calendarDay: number,
): UniversalCycleNumbers {
  const universalYear = universalYearNumber(calendarYear);
  const universalMonth = universalMonthNumber(universalYear, calendarMonth);
  const universalDay = universalDayNumber(universalMonth, calendarDay);
  return { universalYear, universalMonth, universalDay };
}

export function formatUniversalCycleBreakdown(
  calendarYear: number,
  calendarMonth: number,
  calendarDay: number,
): string {
  const { universalYear, universalMonth, universalDay } = universalCycleNumbersFromYMD(
    calendarYear,
    calendarMonth,
    calendarDay,
  );
  const monthExpr = formatTwoDigitPartsExpression(calendarMonth);
  const dayExpr = formatTwoDigitPartsExpression(calendarDay);
  return `UY ${universalYear} + 月 ${monthExpr} → UM ${universalMonth} + 日 ${dayExpr} → UD ${universalDay}`;
}
