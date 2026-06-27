import { describe, expect, it } from "vitest";

import { resolveDailyNumberPost } from "./resolveDailyNumberPost";
import { dailyNumberZipBasename } from "./zipBasename";

describe("dailyNumberZipBasename", () => {
  it("starts with compact scheduled date", () => {
    const resolved = resolveDailyNumberPost({
      scheduledDate: "2026-06-27",
      todayNumber: 8,
      character: "owl",
      messageType: "base",
    });
    if (!resolved.ok) throw new Error("expected ok");

    expect(dailyNumberZipBasename(resolved.payload)).toBe(
      "20260627_kokoro-yoho_ud8_owl",
    );
  });
});
