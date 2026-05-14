import { reduceToSingleDigit } from "@/lib/diary-reading/numerology";
import {
  personalDayNumber,
  personalMonthNumber,
  personalYearNumber,
} from "@/lib/numerology/personalYearMonth";

import { buildDiaryNumbers } from "./numbers";
import { journalReferenceUtcYMD } from "./referenceDateParts";

/** `buildDiaryReadingFromJournalInput` → `generateDiaryReading` に渡る値（暦の日は 1–31 のまま） */
export type OwlReadingGenerationInputEcho = {
  personalYear: number;
  personalMonth: number;
  personalDay: number;
  /** 暦の月 1–12（コメント生成へそのまま渡す） */
  calendarMonth1To12: number;
  /** 暦の日 1–31（コメント生成へそのまま渡す） */
  calendarDay1To31: number;
  /** アクセント用に `reduceToSingleDigit(calendarMonth)` と同じ */
  accentMonthDigit: number;
  /** アクセント用に `reduceToSingleDigit(calendarDay)` と同じ（「日付の数字」は通常これ） */
  accentDayDigit: number;
};

export type JournalNumerologyDebug = {
  /** 記録日の解釈: API と同じ UTC 正午インスタント（ISO） */
  referenceInstantIsoUtc: string;
  /** 記録日の暦（UTC 日付部。フォームの YYYY-MM-DD と一致する想定） */
  calendarYear: number;
  calendarMonth: number;
  calendarDay: number;
  /** 読み解きアクセント用（暦の月・日を桁おろし） */
  calendarMonthDigit: number;
  calendarDayDigit: number;
  /** 上と同じ値を、コメント生成の入力として明示 */
  owlReadingInput: OwlReadingGenerationInputEcho;
  birthMonth: number | null;
  birthDay: number | null;
  personalYear: number;
  personalMonth: number;
  personalDay: number;
  /** 本の見開きなど既存 UI 用（year=PY, month=PM, today=PD） */
  diaryNumbers: ReturnType<typeof buildDiaryNumbers>;
};

export function buildJournalNumerologyDebug(input: {
  referenceDate: Date;
  birthMonth: number | null;
  birthDay: number | null;
  lifePathNumber: number | null;
}): JournalNumerologyDebug {
  const { year: cy, month: cm, day: cd } = journalReferenceUtcYMD(input.referenceDate);
  const birthMonth = input.birthMonth;
  const birthDay = input.birthDay;
  const bm = birthMonth ?? 1;
  const bd = birthDay ?? 1;

  const py = personalYearNumber(bm, bd, cy);
  const pm = personalMonthNumber(py, cm);
  const pd = personalDayNumber(pm, cd);

  const diaryNumbers = buildDiaryNumbers({
    birthMonth,
    birthDay,
    lifePathNumber: input.lifePathNumber,
    date: input.referenceDate,
  });

  const accentMonthDigit = reduceToSingleDigit(cm);
  const accentDayDigit = reduceToSingleDigit(cd);

  return {
    referenceInstantIsoUtc: input.referenceDate.toISOString(),
    calendarYear: cy,
    calendarMonth: cm,
    calendarDay: cd,
    calendarMonthDigit: accentMonthDigit,
    calendarDayDigit: accentDayDigit,
    owlReadingInput: {
      personalYear: py,
      personalMonth: pm,
      personalDay: pd,
      calendarMonth1To12: cm,
      calendarDay1To31: cd,
      accentMonthDigit,
      accentDayDigit,
    },
    birthMonth,
    birthDay,
    personalYear: py,
    personalMonth: pm,
    personalDay: pd,
    diaryNumbers,
  };
}
