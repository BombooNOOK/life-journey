import { describe, expect, it } from "vitest";

import { parseDiaryBookPeriodFields } from "./diaryBookForm";
import { DIARY_BOOK_PERIOD_EDIT_BLOCKED_MESSAGE } from "./diaryBookPeriodEdit";

describe("parseDiaryBookPeriodFields", () => {
  it("parses valid date range", () => {
    expect(parseDiaryBookPeriodFields({ startDate: "2026-01-01", endDate: "2026-07-31" })).toEqual({
      ok: true,
      data: { startDate: "2026-01-01", endDate: "2026-07-31" },
    });
  });

  it("rejects invalid range", () => {
    const result = parseDiaryBookPeriodFields({ startDate: "2026-07-01", endDate: "2026-01-01" });
    expect(result.ok).toBe(false);
  });
});

describe("DIARY_BOOK_PERIOD_EDIT_BLOCKED_MESSAGE", () => {
  it("has user-facing copy", () => {
    expect(DIARY_BOOK_PERIOD_EDIT_BLOCKED_MESSAGE).toContain("製本申込中");
  });
});
