import { describe, expect, it } from "vitest";

import { personalDayNumber, personalMonthNumber, personalYearNumber } from "@/lib/numerology/personalYearMonth";

import { buildJournalNumerologyDebug } from "./journalNumerologyDebug";

describe("buildJournalNumerologyDebug / 5月14日（UTC）", () => {
  /** API と同じく記録日を UTC 正午の 5月14日として解釈 */
  const may142026Utc = new Date(Date.UTC(2026, 4, 14, 12, 0, 0));

  it("owlReadingInput の暦は 5月14日・accent は月5・日5（14→1+4）", () => {
    const debug = buildJournalNumerologyDebug({
      referenceDate: may142026Utc,
      birthMonth: 1,
      birthDay: 4,
      lifePathNumber: null,
    });

    expect(debug.owlReadingInput.calendarMonth1To12).toBe(5);
    expect(debug.owlReadingInput.calendarDay1To31).toBe(14);
    expect(debug.owlReadingInput.accentMonthDigit).toBe(5);
    expect(debug.owlReadingInput.accentDayDigit).toBe(5);
  });

  it("生まれ 1/4 のとき 2026-05-14 は パーソナルデイ 7（検証用）", () => {
    const py = personalYearNumber(1, 4, 2026);
    const pm = personalMonthNumber(py, 5);
    const pd = personalDayNumber(pm, 14);
    expect(pd).toBe(7);

    const debug = buildJournalNumerologyDebug({
      referenceDate: may142026Utc,
      birthMonth: 1,
      birthDay: 4,
      lifePathNumber: null,
    });
    expect(debug.owlReadingInput.personalDay).toBe(7);
  });
});
