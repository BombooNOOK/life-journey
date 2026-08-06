import { describe, expect, it } from "vitest";

import { formatDailyNumberCoverScheduledDate } from "./coverScheduledDate";

describe("formatDailyNumberCoverScheduledDate", () => {
  it("YYYY-MM-DD を日本語＋曜日にする", () => {
    expect(formatDailyNumberCoverScheduledDate("2026-07-15")).toBe("2026年7月15日（水）");
  });

  it("不正な日付は null", () => {
    expect(formatDailyNumberCoverScheduledDate("")).toBeNull();
    expect(formatDailyNumberCoverScheduledDate("2026-02-30")).toBeNull();
  });
});
