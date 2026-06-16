import { describe, expect, it } from "vitest";

import {
  currentMonthAnchorInJapan,
  currentYearInJapan,
  journalListMonthOptions,
  journalListPathForMonth,
  journalListYearOptions,
  monthAnchorFromYearMonth,
  monthKeyFromDateAnchor,
  shiftMonthAnchor,
} from "@/lib/journal/journalNav";

describe("journalListYearOptions", () => {
  it("lists years down to minimum", () => {
    const years = journalListYearOptions(2026);
    expect(years[0]).toBe(2026);
    expect(years[years.length - 1]).toBe(1970);
  });
});

describe("journalListMonthOptions", () => {
  it("lists 12 months", () => {
    expect(journalListMonthOptions()).toHaveLength(12);
    expect(journalListMonthOptions()[5]?.label).toBe("6月");
  });
});

describe("monthAnchorFromYearMonth", () => {
  it("builds month anchor", () => {
    expect(monthKeyFromDateAnchor(monthAnchorFromYearMonth(2026, 6))).toBe("2026-06");
  });
});

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
