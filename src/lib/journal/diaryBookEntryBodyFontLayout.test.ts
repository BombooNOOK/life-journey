import { describe, expect, it } from "vitest";

import {
  DIARY_BOOK_ENTRY_V2_COMPACT_FONT_SIZE_PX,
  getDiaryBookEntryV2BodyFontLayout,
} from "@/lib/journal/diaryBookEntryBodyFontLayout";

describe("getDiaryBookEntryV2BodyFontLayout", () => {
  it("uses 15px for compact (same as owl comment body)", () => {
    const layout = getDiaryBookEntryV2BodyFontLayout("compact");
    expect(layout.fontSizePx).toBe(DIARY_BOOK_ENTRY_V2_COMPACT_FONT_SIZE_PX);
    expect(layout.lineHeight).toBe(1.62);
    expect(layout.maxCharsPerLine).toBe(39);
    expect(layout.maxLines).toBe(11);
    expect(layout.maxBindingChars).toBe(429);
  });

  it("derives standard from legacy ratio with airy line height (案D)", () => {
    const layout = getDiaryBookEntryV2BodyFontLayout("standard");
    expect(layout.fontSizePx).toBe(20.1);
    expect(layout.lineHeight).toBe(1.8);
    expect(layout.maxCharsPerLine).toBe(29);
    expect(layout.maxLines).toBe(7);
    expect(layout.maxBindingChars).toBe(203);
  });

  it("derives relaxed as largest font with most line spacing (案D)", () => {
    const layout = getDiaryBookEntryV2BodyFontLayout("relaxed");
    expect(layout.fontSizePx).toBe(23.7);
    expect(layout.lineHeight).toBe(1.9);
    expect(layout.maxCharsPerLine).toBe(25);
    expect(layout.maxLines).toBe(6);
    expect(layout.maxBindingChars).toBe(150);
  });

  it("derives generous between standard and compact (案D)", () => {
    const layout = getDiaryBookEntryV2BodyFontLayout("generous");
    expect(layout.fontSizePx).toBe(16.3);
    expect(layout.lineHeight).toBe(1.68);
    expect(layout.maxCharsPerLine).toBe(36);
    expect(layout.maxLines).toBe(10);
    expect(layout.maxBindingChars).toBe(360);
  });

  it("defaults unknown mode to standard", () => {
    expect(getDiaryBookEntryV2BodyFontLayout(null).maxBindingChars).toBe(203);
    expect(getDiaryBookEntryV2BodyFontLayout("invalid").maxBindingChars).toBe(203);
  });
});
