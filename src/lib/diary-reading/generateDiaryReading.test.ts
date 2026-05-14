import { describe, expect, it } from "vitest";

import { generateDiaryReading } from "./generateDiaryReading";

describe("generateDiaryReading（暦の月・日とパーソナルデイ）", () => {
  it("パーソナルデイが暦の月の桁とだけ揃うとき、日付一致用の補足（日を桁おろし）にはならない", () => {
    const { text } = generateDiaryReading({
      actionCategory: "ordinary_record",
      mood: "calm",
      personalYear: 1,
      personalMonth: 5,
      personalDay: 7,
      calendarMonth: 7,
      calendarDay: 14,
      recentTemplateIds: [],
    });
    expect(text).not.toContain("パーソナルデイと、日付を桁おろした数字がどちらも");
  });

  it("月重なりアクセントでは暦の月を明示し、日付の桁おろしとは混同されにくい", () => {
    const { text } = generateDiaryReading({
      actionCategory: "ordinary_record",
      mood: "calm",
      personalYear: 1,
      personalMonth: 5,
      personalDay: 7,
      calendarMonth: 7,
      calendarDay: 14,
      recentTemplateIds: [],
    });
    const hasMonthOverlapCopy =
      text.includes("暦の月の数字が7と揃う") || text.includes("暦の月の7の響きとも重なる");
    expect(hasMonthOverlapCopy).toBe(true);
  });
});
