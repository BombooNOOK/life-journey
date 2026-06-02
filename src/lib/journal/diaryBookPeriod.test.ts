import { describe, expect, it } from "vitest";

import {
  journalEntryCreatedAtRangeForBookPeriod,
  parseDiaryBookDateInput,
  parseDiaryBookDateRange,
} from "./diaryBookPeriod";

describe("parseDiaryBookDateInput", () => {
  it("accepts valid YYYY-MM-DD", () => {
    expect(parseDiaryBookDateInput("2025-10-01")).toBe("2025-10-01");
  });

  it("rejects invalid calendar day", () => {
    expect(parseDiaryBookDateInput("2025-02-30")).toBeNull();
  });
});

describe("parseDiaryBookDateRange", () => {
  it("allows cross-year ranges", () => {
    expect(parseDiaryBookDateRange("2025-10-01", "2026-03-31")).toEqual({
      startDate: "2025-10-01",
      endDate: "2026-03-31",
    });
  });

  it("rejects start after end", () => {
    expect(parseDiaryBookDateRange("2026-01-01", "2025-12-31")).toBeNull();
  });
});

describe("journalEntryCreatedAtRangeForBookPeriod", () => {
  it("uses UTC noon for inclusive record-day bounds", () => {
    const range = journalEntryCreatedAtRangeForBookPeriod({
      startDate: "2025-10-01",
      endDate: "2026-03-31",
    });
    expect(range.gte.toISOString()).toBe("2025-10-01T12:00:00.000Z");
    expect(range.lte.toISOString()).toBe("2026-03-31T12:00:00.000Z");
  });
});
