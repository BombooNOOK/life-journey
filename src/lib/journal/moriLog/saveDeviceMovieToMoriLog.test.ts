import { describe, expect, it } from "vitest";

import { deviceMovieLocalEntryDateKey } from "@/lib/journal/moriLog/saveDeviceMovieToMoriLog";

describe("deviceMovieLocalEntryDateKey", () => {
  it("formats local calendar day as YYYY-MM-DD", () => {
    const key = deviceMovieLocalEntryDateKey(new Date(2026, 7, 5, 15, 30, 0));
    expect(key).toBe("2026-08-05");
  });
});
