import { describe, expect, it } from "vitest";

import { buildDiaryReadingFromJournalInput } from "./fromJournal";
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

describe("2026-05-14 UTC（暦の月・日とも桁5、パーソナルデイ7）", () => {
  const may142026Utc = new Date(Date.UTC(2026, 4, 14, 12, 0, 0));

  it("fromJournal 経由でも暦を7扱いする文言（どちらも7等）は出ない", () => {
    const { text } = buildDiaryReadingFromJournalInput({
      activity: "record_anyway",
      mood: "calm",
      referenceDate: may142026Utc,
      birthMonth: 1,
      birthDay: 4,
      recentTemplateIds: [],
    });
    expect(text).not.toContain("パーソナルデイと、日付を桁おろした数字がどちらも");
    expect(text).not.toContain("暦の月と日がどちらも「7」");
    expect(text).not.toMatch(/どちらも「7」/);
    // 暦の月と日の桁が両方5のときの重なり（5）か、ベース文のパーソナルデイ7
    expect(text).toMatch(/どちらも「5」|今日は「7」の流れ/);
  });
});
