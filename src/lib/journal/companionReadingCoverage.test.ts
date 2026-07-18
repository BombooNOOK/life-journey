import { describe, expect, it } from "vitest";

import { baseComments } from "@/lib/diary-reading/baseComments";
import {
  calendarDayAccents,
  calendarMonthAccents,
  calendarMonthDayOverlapAccents,
  personalDayCalendarDayOverlapAccents,
  personalDayCalendarMonthOverlapAccents,
  specialOverlapAccents,
} from "@/lib/diary-reading/calendarAccents";
import { getCompanionAccentText } from "@/lib/journal/commentCalendarAccentByCompanion";
import { getCompanionBaseCommentText } from "@/lib/journal/commentPersonalDayActivityByCompanion";
import { companionTypes } from "@/lib/journal/meta";

const accentTemplates = [
  ...calendarMonthAccents,
  ...calendarDayAccents,
  ...calendarMonthDayOverlapAccents,
  ...personalDayCalendarDayOverlapAccents,
  ...personalDayCalendarMonthOverlapAccents,
  ...specialOverlapAccents,
];

const accentById = new Map(accentTemplates.map((item) => [item.id, item]));

describe("companion reading manuscript coverage", () => {
  it("covers every production base template with distinct non-owl copy", () => {
    const baseIds = baseComments.map((item) => item.id);
    expect(baseIds.length).toBe(162);

    for (const companion of companionTypes) {
      let empty = 0;
      let sameAsOwl = 0;
      for (const id of baseIds) {
        const text = getCompanionBaseCommentText(id, companion).trim();
        const owl = getCompanionBaseCommentText(id, "owl").trim();
        if (!text) empty += 1;
        else if (companion !== "owl" && text === owl) sameAsOwl += 1;
      }
      expect({ companion, empty, sameAsOwl }).toEqual({
        companion,
        empty: 0,
        sameAsOwl: 0,
      });
    }
  });

  it("covers every production accent template with distinct non-owl copy", () => {
    const accentIds = [...accentById.keys()];
    expect(accentIds.length).toBe(99);

    for (const companion of companionTypes) {
      let empty = 0;
      let sameAsOwl = 0;
      for (const id of accentIds) {
        const owlFallback = accentById.get(id)?.text ?? "";
        const text = getCompanionAccentText(id, companion, owlFallback).trim();
        const owl = getCompanionAccentText(id, "owl", owlFallback).trim();
        if (!text) empty += 1;
        else if (companion !== "owl" && text === owl) sameAsOwl += 1;
      }
      expect({ companion, empty, sameAsOwl }).toEqual({
        companion,
        empty: 0,
        sameAsOwl: 0,
      });
    }
  });
});
