import { describe, expect, it } from "vitest";

import {
  DIARY_BOOK_ENTRY_V2_DESIGN,
  estimateDiaryBookEntryDateRowWidthPx,
  getDiaryBookEntryDateRowLeftPx,
  DIARY_BOOK_ENTRY_V2_DATE,
} from "@/lib/journal/diaryBookEntryPrintLayout";
import { getDiaryPreviewDateRowSegments } from "@/lib/journal/diaryPreviewFixedLayout";

/** 上部装飾枝のおおよその表示範囲（diary-book-body-design-*.png 走査） */
const DATE_BRANCH_RIGHT_PX = 679;

function dateSegmentsWithoutLabel(date: Date) {
  return getDiaryPreviewDateRowSegments(date).filter((segment) => segment.key !== "label");
}

function measuredDateRowWidthPx(
  segments: ReturnType<typeof dateSegmentsWithoutLabel>,
  fontSizePx: number,
): number {
  return (
    estimateDiaryBookEntryDateRowWidthPx(
      segments,
      fontSizePx,
      DIARY_BOOK_ENTRY_V2_DATE.letterSpacingEm,
      DIARY_BOOK_ENTRY_V2_DATE.segmentGapPx,
    ) + DIARY_BOOK_ENTRY_V2_DATE.measuredWidthExtraPx
  );
}

describe("diary book entry date row layout", () => {
  it("keeps two-digit month/day (12/25) within page and branch on the right", () => {
    const singleDigit = dateSegmentsWithoutLabel(new Date("2026-06-05T10:00:00.000Z"));
    const doubleDigit = dateSegmentsWithoutLabel(new Date("2026-12-25T10:00:00.000Z"));
    const fontSizePx = DIARY_BOOK_ENTRY_V2_DATE.fontSizePx;

    const singleWidth = measuredDateRowWidthPx(singleDigit, fontSizePx);
    const doubleWidth = measuredDateRowWidthPx(doubleDigit, fontSizePx);
    const doubleLeft = getDiaryBookEntryDateRowLeftPx(doubleDigit, fontSizePx);
    const doubleRight = doubleLeft + doubleWidth;

    expect(doubleWidth - singleWidth).toBeLessThan(50);
    expect(doubleRight).toBeLessThanOrEqual(DATE_BRANCH_RIGHT_PX);
    expect(doubleLeft).toBeGreaterThanOrEqual(0);
    expect(doubleRight).toBeLessThanOrEqual(DIARY_BOOK_ENTRY_V2_DESIGN.widthPx);
  });

  it("keeps widest dates within page", () => {
    const segments = dateSegmentsWithoutLabel(new Date("2026-12-31T10:00:00.000Z"));
    const fontSizePx = DIARY_BOOK_ENTRY_V2_DATE.fontSizePx;
    const width = measuredDateRowWidthPx(segments, fontSizePx);
    const left = getDiaryBookEntryDateRowLeftPx(segments, fontSizePx);
    const right = left + width;

    expect(left).toBeGreaterThanOrEqual(0);
    expect(right).toBeLessThanOrEqual(DIARY_BOOK_ENTRY_V2_DESIGN.widthPx);
    expect(right).toBeLessThanOrEqual(DATE_BRANCH_RIGHT_PX + 8);
  });
});
