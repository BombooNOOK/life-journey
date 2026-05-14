import { reduceToSingleDigit } from "@/lib/diary-reading/numerology";
import {
  personalDayNumber,
  personalMonthNumber,
  personalYearNumber,
} from "@/lib/numerology/personalYearMonth";

import { buildDiaryNumbers } from "./numbers";
import { journalReferenceUtcYMD } from "./referenceDateParts";

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

  return {
    referenceInstantIsoUtc: input.referenceDate.toISOString(),
    calendarYear: cy,
    calendarMonth: cm,
    calendarDay: cd,
    calendarMonthDigit: reduceToSingleDigit(cm),
    calendarDayDigit: reduceToSingleDigit(cd),
    birthMonth,
    birthDay,
    personalYear: py,
    personalMonth: pm,
    personalDay: pd,
    diaryNumbers,
  };
}
