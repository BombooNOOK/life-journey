import {
  calendarDayAccentDraft,
  calendarMonthAccentDraft,
  specialAccentDraft,
} from "@/lib/journal/commentCalendarAccentDraft";

import type { AccentTemplate, NumerologyNumber } from "./types";

export const calendarMonthAccents: AccentTemplate[] = Object.entries(
  calendarMonthAccentDraft,
).flatMap(([number, entry]) =>
  entry.lines.map((text, idx) => ({
    id: `calendar_month_${number}_${idx + 1}`,
    number: Number(number) as NumerologyNumber,
    type: "calendar_month",
    text,
  })),
);

export const calendarDayAccents: AccentTemplate[] = Object.entries(
  calendarDayAccentDraft,
).flatMap(([number, entry]) =>
  entry.lines.map((text, idx) => ({
    id: `calendar_day_${number}_${idx + 1}`,
    number: Number(number) as NumerologyNumber,
    type: "calendar_day",
    text,
  })),
);

const overlapLinesByNumber = new Map<NumerologyNumber, string[]>(
  ([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).map((n): [NumerologyNumber, string[]] => {
    const month = specialAccentDraft.personalDayEqualsCalendarMonth.map((s) =>
      s.replaceAll("{n}", String(n)),
    );
    const day = specialAccentDraft.personalDayEqualsCalendarDay.map((s) =>
      s.replaceAll("{n}", String(n)),
    );
    const calendar = specialAccentDraft.calendarMonthEqualsCalendarDay.map((s) =>
      s.replaceAll("{n}", String(n)),
    );
    return [n as NumerologyNumber, [...month, ...day, ...calendar]];
  }),
);

export const specialOverlapAccents: AccentTemplate[] = Array.from(
  overlapLinesByNumber.entries(),
).flatMap(([number, lines]) =>
  lines.map((text, idx) => ({
    id: `special_overlap_${number}_${idx + 1}`,
    number,
    type: "special_overlap",
    text,
  })),
);
