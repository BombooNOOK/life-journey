import { GUARDIAN_COLORS } from "@/lib/kantei/todayHintContent";
import {
  personalDayNumber,
  personalMonthNumber,
  personalYearNumber,
} from "@/lib/numerology/personalYearMonth";

/** 記録日 YYYY-MM-DD から、その日のお守りカラー名（1〜9 → GUARDIAN_COLORS） */
export function guardianColorNameForEntryDate(params: {
  birthMonth: number;
  birthDay: number;
  entryDateYmd: string;
}): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(params.entryDateYmd.trim());
  if (!match) return GUARDIAN_COLORS[0];

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return GUARDIAN_COLORS[0];
  }

  const personalYear = personalYearNumber(params.birthMonth, params.birthDay, year);
  const personalMonth = personalMonthNumber(personalYear, month);
  const personalDay = personalDayNumber(personalMonth, day);
  const index = (personalDay - 1 + GUARDIAN_COLORS.length) % GUARDIAN_COLORS.length;
  return GUARDIAN_COLORS[index] ?? GUARDIAN_COLORS[0];
}
