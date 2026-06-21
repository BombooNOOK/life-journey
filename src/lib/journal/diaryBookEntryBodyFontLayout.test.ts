import { describe, expect, it } from "vitest";

import {
  DIARY_BOOK_ENTRY_V2_COMPACT_FONT_SIZE_PX,
  getDiaryBookEntryV2BodyFontLayout,
} from "@/lib/journal/diaryBookEntryBodyFontLayout";

describe("getDiaryBookEntryV2BodyFontLayout", () => {
  it("uses 15px for compact", () => {
    const layout = getDiaryBookEntryV2BodyFontLayout("compact");
    expect(layout.fontSizePx).toBe(DIARY_BOOK_ENTRY_V2_COMPACT_FONT_SIZE_PX);
    expect(layout.lineHeight).toBe(1.62);
    expect(layout.maxCharsPerLine).toBe(40);
    expect(layout.maxLines).toBe(11);
    expect(layout.maxBindingChars).toBe(440);
  });

  it("uses standard from Chappy 724 coords", () => {
    const layout = getDiaryBookEntryV2BodyFontLayout("standard");
    expect(layout.fontSizePx).toBe(20);
    expect(layout.lineHeight).toBe(1.75);
    expect(layout.maxCharsPerLine).toBe(30);
    expect(layout.maxLines).toBe(7);
    expect(layout.maxBindingChars).toBe(210);
  });

  it("uses relaxed as largest font with most line spacing", () => {
    const layout = getDiaryBookEntryV2BodyFontLayout("relaxed");
    expect(layout.fontSizePx).toBe(24);
    expect(layout.lineHeight).toBe(1.9);
    expect(layout.maxCharsPerLine).toBe(25);
    expect(layout.maxLines).toBe(6);
    expect(layout.maxBindingChars).toBe(150);
  });

  it("uses generous between standard and compact", () => {
    const layout = getDiaryBookEntryV2BodyFontLayout("generous");
    expect(layout.fontSizePx).toBe(16);
    expect(layout.lineHeight).toBe(1.68);
    expect(layout.maxCharsPerLine).toBe(37);
    expect(layout.maxLines).toBe(10);
    expect(layout.maxBindingChars).toBe(370);
  });

  it("defaults unknown mode to standard", () => {
    expect(getDiaryBookEntryV2BodyFontLayout(null).maxBindingChars).toBe(210);
    expect(getDiaryBookEntryV2BodyFontLayout("invalid").maxBindingChars).toBe(210);
  });
});
