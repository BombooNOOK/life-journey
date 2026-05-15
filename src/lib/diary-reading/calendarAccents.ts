import {
  calendarDayAccentDraft,
  calendarMonthAccentDraft,
  specialAccentDraft,
} from "@/lib/journal/commentCalendarAccentDraft";

import type { AccentTemplate, NumerologyNumber } from "./types";

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

/** パーソナルデイ＝暦の月（桁おろし）が同じときだけ使う */
export const personalDayCalendarMonthOverlapAccents: AccentTemplate[] = DIGITS.flatMap((n) =>
  specialAccentDraft.personalDayEqualsCalendarMonth.map((s, idx) => ({
    id: `special_overlap_pm_${n}_${idx + 1}`,
    number: n as NumerologyNumber,
    type: "special_overlap" as const,
    text: s.replaceAll("{pd}", String(n)).replaceAll("{monthDigit}", String(n)),
    overlapSource: "personal_month" as const,
  })),
);

/** パーソナルデイ＝日付の桁おろしが同じときだけ使う */
export const personalDayCalendarDayOverlapAccents: AccentTemplate[] = DIGITS.flatMap((n) =>
  specialAccentDraft.personalDayEqualsCalendarDay.map((s, idx) => ({
    id: `special_overlap_pd_${n}_${idx + 1}`,
    number: n as NumerologyNumber,
    type: "special_overlap" as const,
    text: s.replaceAll("{pd}", String(n)).replaceAll("{dayDigit}", String(n)),
    overlapSource: "personal_day" as const,
  })),
);

/** 暦の月と日の桁おろしが同じだけのとき（パーソナルデイとは無関係の重なり） */
export const calendarMonthDayOverlapAccents: AccentTemplate[] = DIGITS.flatMap((n) =>
  specialAccentDraft.calendarMonthEqualsCalendarDay.map((s, idx) => ({
    id: `special_overlap_md_${n}_${idx + 1}`,
    number: n as NumerologyNumber,
    type: "special_overlap" as const,
    text: s
      .replaceAll("{monthDigit}", String(n))
      .replaceAll("{dayDigit}", String(n))
      .replaceAll("{n}", String(n)),
    overlapSource: "calendar_md" as const,
  })),
);

export const calendarMonthAccents: AccentTemplate[] = Object.entries(
  calendarMonthAccentDraft,
).flatMap(([number, entry]) =>
  entry.lines.map((text, idx) => ({
    id: `calendar_month_${number}_${idx + 1}`,
    number: Number(number) as NumerologyNumber,
    type: "calendar_month" as const,
    text,
  })),
);

export const calendarDayAccents: AccentTemplate[] = Object.entries(
  calendarDayAccentDraft,
).flatMap(([number, entry]) =>
  entry.lines.map((text, idx) => ({
    id: `calendar_day_${number}_${idx + 1}`,
    number: Number(number) as NumerologyNumber,
    type: "calendar_day" as const,
    text,
  })),
);

/** 重なりアクセント全体（重複検出などで列挙する用） */
export const specialOverlapAccents: AccentTemplate[] = [
  ...personalDayCalendarMonthOverlapAccents,
  ...personalDayCalendarDayOverlapAccents,
  ...calendarMonthDayOverlapAccents,
];
