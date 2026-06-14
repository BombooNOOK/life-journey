import { describe, expect, it } from "vitest";

import {
  getDiaryBookEntryV2BodyLayoutLines,
  getDiaryBookEntryV2BodyMaxLines,
} from "@/lib/journal/diaryBookEntryBodyWrap";
import { getDiaryBookEntryV2BodyFontLayout } from "@/lib/journal/diaryBookEntryBodyFontLayout";

describe("getDiaryBookEntryV2BodyLayoutLines", () => {
  it("wraps at mode-specific chars with bracket pullback (compact)", () => {
    const { maxCharsPerLine } = getDiaryBookEntryV2BodyFontLayout("compact");
    const text = `${"あ".repeat(20)}『短い』${"い".repeat(10)}。`;
    const lines = getDiaryBookEntryV2BodyLayoutLines(text, "compact");
    expect(lines.every((line) => line.length <= maxCharsPerLine + 5)).toBe(true);
    expect(lines.join("")).toBe(text);
    expect(lines.some((line) => line.includes("『短い』"))).toBe(true);
  });

  it("respects manual newlines", () => {
    const lines = getDiaryBookEntryV2BodyLayoutLines("一行目\n二行目", "standard");
    expect(lines[0]).toBe("一行目");
    expect(lines[1]).toBe("二行目");
  });

  it("clips to slot max lines per mode", () => {
    const { maxCharsPerLine } = getDiaryBookEntryV2BodyFontLayout("standard");
    const long = "あ".repeat(maxCharsPerLine * 20);
    const lines = getDiaryBookEntryV2BodyLayoutLines(long, "standard");
    expect(lines).toHaveLength(getDiaryBookEntryV2BodyMaxLines("standard"));
  });
});
