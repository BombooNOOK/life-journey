import { describe, expect, it } from "vitest";

import { japanTodayAnchorDate } from "@/lib/date/japanCalendarDate";

describe("japanTodayAnchorDate", () => {
  it("uses Asia/Tokyo calendar day on UTC server", () => {
    // 2026-06-18 20:00 UTC = 2026-06-19 05:00 JST
    const anchor = japanTodayAnchorDate(new Date("2026-06-18T20:00:00.000Z"));
    expect(anchor.toISOString()).toBe("2026-06-19T12:00:00.000Z");
  });
});
