import { describe, expect, it } from "vitest";

import {
  bindingAdjustmentIllustrationPagesNeeded,
  countDiaryBookBindingBodyPages,
  DIARY_BOOK_BINDING_MODE_PERFECT,
  DIARY_BOOK_BINDING_MODE_SADDLE,
} from "./diaryBookBindingMode";

describe("countDiaryBookBindingBodyPages", () => {
  it("excludes cover, inside sheets, and back", () => {
    expect(countDiaryBookBindingBodyPages(10)).toBe(6);
  });
});

describe("bindingAdjustmentIllustrationPagesNeeded", () => {
  it("needs 0 when already multiple of 2 (perfect binding)", () => {
    expect(bindingAdjustmentIllustrationPagesNeeded(6, DIARY_BOOK_BINDING_MODE_PERFECT)).toBe(0);
    expect(bindingAdjustmentIllustrationPagesNeeded(7, DIARY_BOOK_BINDING_MODE_PERFECT)).toBe(1);
  });

  it("pads to multiple of 4 (saddle stitch)", () => {
    expect(bindingAdjustmentIllustrationPagesNeeded(5, DIARY_BOOK_BINDING_MODE_SADDLE)).toBe(3);
    expect(bindingAdjustmentIllustrationPagesNeeded(8, DIARY_BOOK_BINDING_MODE_SADDLE)).toBe(0);
  });
});
