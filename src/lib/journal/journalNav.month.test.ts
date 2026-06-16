import { describe, expect, it } from "vitest";

import {
  currentMonthAnchorInJapan,
  journalListPathForMonth,
  monthKeyFromDateAnchor,
  shiftMonthAnchor,
} from "@/lib/journal/journalNav";

describe("monthKeyFromDateAnchor", () => {
  it("formats YYYY-MM from month anchor", () => {
    expect(monthKeyFromDateAnchor(new Date(2026, 5, 1))).toBe("2026-06");
  });
});

describe("shiftMonthAnchor", () => {
  it("moves to previous and next month", () => {
    const june = new Date(2026, 5, 1);
    expect(monthKeyFromDateAnchor(shiftMonthAnchor(june, -1))).toBe("2026-05");
    expect(monthKeyFromDateAnchor(shiftMonthAnchor(june, 1))).toBe("2026-07");
  });
});

describe("journalListPathForMonth", () => {
  it("builds list path with month query", () => {
    expect(journalListPathForMonth("2026-06")).toBe("/orders/list?month=2026-06");
  });
});

describe("currentMonthAnchorInJapan", () => {
  it("returns first day of month", () => {
    const anchor = currentMonthAnchorInJapan();
    expect(anchor.getDate()).toBe(1);
  });
});
