import { personalYearCycleEntry } from "./data/personalYearCycleData";
import { personalMonthEntry } from "./data/personalMonthData";

import { sumDigits } from "./reduce";

/** パーソナルイヤー／マンス用。11・22・33 を残さず 1〜9 まで縮約 */
export function reducePersonalCycleNumber(value: number): number {
  let n = Math.abs(Math.floor(value));
  if (n === 0) return 9;
  while (n > 9) {
    n = sumDigits(n);
  }
  return n;
}

/**
 * パーソナルイヤー = 生まれ月 + 生まれ日 + 対象年（カレンダー年）→ 1 桁まで縮約
 * 切り替えは誕生日ではなく 1 月 1 日基準（対象年ごとにこの式を評価する）。
 */
export function personalYearNumber(
  birthMonth: number,
  birthDay: number,
  calendarYear: number,
): number {
  const raw =
    Math.floor(birthMonth) + Math.floor(birthDay) + Math.floor(calendarYear);
  return reducePersonalCycleNumber(raw);
}

/**
 * パーソナルマンス = パーソナルイヤー（1〜9）+ 対象月（1〜12）→ 1 桁まで縮約
 */
export function personalMonthNumber(
  personalYearDigit: number,
  calendarMonth: number,
): number {
  const raw =
    Math.floor(personalYearDigit) + Math.floor(calendarMonth);
  return reducePersonalCycleNumber(raw);
}

/**
 * パーソナルデイ = パーソナルマンス（1〜9）+ 対象日（1〜31）→ 1 桁まで縮約
 */
export function personalDayNumber(
  personalMonthDigit: number,
  calendarDay: number,
): number {
  const raw =
    Math.floor(personalMonthDigit) + Math.floor(calendarDay);
  return reducePersonalCycleNumber(raw);
}

export type PersonalYearTableRow = {
  calendarYear: number;
  cycleNumber: number;
  theme: string;
  subtitle: string;
  article: string;
};

export type PersonalMonthTableRow = {
  calendarYear: number;
  calendarMonth: number;
  personalMonthNumber: number;
  theme: string;
  subtitle: string;
  article: string;
};

const NINE_YEAR_SPAN = 9;

/**
 * 基準日の「西暦年」を起点に、これから 9 年分（その年を含む）のパーソナルイヤー一覧行を返す。
 * 例: 基準が 2026 年なら 2026 … 2034。
 */
export function buildPersonalYearNineYearRows(
  birthMonth: number,
  birthDay: number,
  referenceDate: Date,
): PersonalYearTableRow[] {
  const startYear = referenceDate.getFullYear();
  const rows: PersonalYearTableRow[] = [];
  for (let i = 0; i < NINE_YEAR_SPAN; i++) {
    const calendarYear = startYear + i;
    const cycleNumber = personalYearNumber(birthMonth, birthDay, calendarYear);
    const entry = personalYearCycleEntry(cycleNumber);
    rows.push({
      calendarYear,
      cycleNumber,
      theme: entry.theme,
      subtitle: entry.subtitle,
      article: entry.article,
    });
  }
  return rows;
}

const THREE_MONTH_SPAN = 3;

/**
 * 購入月（注文作成月）を起点に、その月を含む 3 か月分のパーソナルマンス行を返す。
 */
export function buildPersonalMonthThreeMonthRows(
  birthMonth: number,
  birthDay: number,
  purchaseDate: Date,
): PersonalMonthTableRow[] {
  const startYear = purchaseDate.getFullYear();
  const startMonth = purchaseDate.getMonth() + 1;
  const rows: PersonalMonthTableRow[] = [];

  for (let i = 0; i < THREE_MONTH_SPAN; i++) {
    const zeroBaseMonth = startMonth - 1 + i;
    const calendarYear = startYear + Math.floor(zeroBaseMonth / 12);
    const calendarMonth = (zeroBaseMonth % 12) + 1;
    const py = personalYearNumber(birthMonth, birthDay, calendarYear);
    const pm = personalMonthNumber(py, calendarMonth);
    const entry = personalMonthEntry(pm);
    rows.push({
      calendarYear,
      calendarMonth,
      personalMonthNumber: pm,
      theme: entry.theme,
      subtitle: entry.subtitle,
      article: entry.article,
    });
  }

  return rows;
}
