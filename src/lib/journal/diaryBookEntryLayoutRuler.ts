import {
  DIARY_BOOK_ENTRY_V2_BODY,
  DIARY_BOOK_ENTRY_V2_COMMENT,
  DIARY_BOOK_ENTRY_V2_DATE,
  DIARY_BOOK_ENTRY_V2_MOOD,
  DIARY_BOOK_ENTRY_V2_NUMBERS,
  DIARY_BOOK_ENTRY_V2_PHOTO,
  estimateDiaryBookEntryDateRowWidthPx,
} from "@/lib/journal/diaryBookEntryPrintLayout";

/** プレビュー上の基準マス（724×1024 設計 px の一辺） */
export const DIARY_BOOK_ENTRY_LAYOUT_RULER_SQUARE_PX = 5;

export const DIARY_BOOK_ENTRY_LAYOUT_RULER_TARGETS = [
  "photo",
  "date",
  "numbers",
  "mood",
  "body",
  "comment",
] as const;

export type DiaryBookEntryLayoutRulerTarget =
  (typeof DIARY_BOOK_ENTRY_LAYOUT_RULER_TARGETS)[number];

export function parseDiaryBookEntryLayoutRulerTarget(
  raw: string | null | undefined,
): DiaryBookEntryLayoutRulerTarget | null {
  const value = raw?.trim();
  if (!value) return null;
  return (DIARY_BOOK_ENTRY_LAYOUT_RULER_TARGETS as readonly string[]).includes(value)
    ? (value as DiaryBookEntryLayoutRulerTarget)
    : null;
}

export function getDiaryBookEntryLayoutRulerAnchor(
  target: DiaryBookEntryLayoutRulerTarget,
  dateRowLeftPx: number,
  dateRowWidthPx: number,
): { leftPx: number; topPx: number } {
  const gap = 8;
  switch (target) {
    case "photo": {
      const photo = DIARY_BOOK_ENTRY_V2_PHOTO;
      return {
        leftPx: photo.contentLeftPx + photo.contentSizePx + gap,
        topPx: photo.contentTopPx + gap,
      };
    }
    case "date":
      return {
        leftPx: dateRowLeftPx + dateRowWidthPx + gap,
        topPx: DIARY_BOOK_ENTRY_V2_DATE.topPx,
      };
    case "numbers":
      return {
        leftPx:
          DIARY_BOOK_ENTRY_V2_NUMBERS.headerLeftPx +
          DIARY_BOOK_ENTRY_V2_NUMBERS.headerWidthPx +
          gap,
        topPx: DIARY_BOOK_ENTRY_V2_NUMBERS.headerTopPx,
      };
    case "mood":
      return {
        leftPx:
          DIARY_BOOK_ENTRY_V2_MOOD.headerLeftPx + DIARY_BOOK_ENTRY_V2_MOOD.headerWidthPx + gap,
        topPx: DIARY_BOOK_ENTRY_V2_MOOD.headerTopPx,
      };
    case "body":
      return {
        leftPx: DIARY_BOOK_ENTRY_V2_BODY.contentLeftPx + gap,
        topPx: DIARY_BOOK_ENTRY_V2_BODY.contentTopPx + gap,
      };
    case "comment":
      return {
        leftPx: DIARY_BOOK_ENTRY_V2_COMMENT.contentLeftPx + gap,
        topPx: DIARY_BOOK_ENTRY_V2_COMMENT.contentTopPx + gap,
      };
    default:
      return { leftPx: gap, topPx: gap };
  }
}

export function estimateDiaryBookEntryDateRowLayoutWidthPx(
  segments: readonly { text: string }[],
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
