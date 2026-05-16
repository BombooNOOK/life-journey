import { describe, expect, it } from "vitest";

import { personalDayCalendarDayOverlapAccents } from "./calendarAccents";
import { buildDiaryReadingFromJournalInput } from "./fromJournal";
import { generateDiaryReading } from "./generateDiaryReading";

describe("generateDiaryReading（暦の月・日とパーソナルデイ）", () => {
  it("パーソナルデイが暦の月の桁とだけ揃うとき、暦の日の桁をパーソナルデイの数字で書かない", () => {
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
    expect(text).not.toContain("暦の「日」を桁おろすと「7」");
    expect(text).not.toMatch(/日付の7の響き/);
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
      text.includes("暦の月を桁おろした数字も「7」") || text.includes("暦の月を桁おろすと「7」");
    expect(hasMonthOverlapCopy).toBe(true);
  });
});

describe("calendarAccents 重なりテンプレの埋め込み", () => {
  it("PD=暦の日桁 用テンプレは {pd} と {dayDigit} を別置換し、同じ数字でも暦側を明示する", () => {
    const t = personalDayCalendarDayOverlapAccents.find((a) => a.id === "special_overlap_pd_7_1");
    expect(t?.text).toContain("パーソナルデイ）は「7」");
    expect(t?.text).toContain("暦の日を桁おろした数字も「7」");
    const t2 = personalDayCalendarDayOverlapAccents.find((a) => a.id === "special_overlap_pd_7_2");
    expect(t2?.text).toContain("パーソナルデイは「7」");
    expect(t2?.text).toContain("日付を桁おろした数字も「7」");
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
    expect(text).not.toContain("暦の「日」を桁おろすと「7」");
    expect(text).not.toMatch(/日付の7の響き/);
    expect(text).not.toMatch(/どちらも「7」/);
    expect(text).toMatch(/暦の月を桁おろすと「5」|同じ数字「5」|今日は「7」の流れ/);
  });
});
