import {
  normalizeContentFontMode,
  type ContentFontMode,
} from "@/lib/journal/contentFontMode";
import { DIARY_BOOK_ENTRY_V2_BODY } from "@/lib/journal/diaryBookEntryPrintLayout";

/** 旧製本プレビュー「ぎゅっと」の字サイズ（比例換算の基準） */
const LEGACY_COMPACT_FONT_SIZE_PX = 11.7875;

/** v2 最小＝フクロウ読み解き本文と同じ */
export const DIARY_BOOK_ENTRY_V2_COMPACT_FONT_SIZE_PX = 15;

const MODE_LEGACY_FONT_SIZE_PX: Record<ContentFontMode, number> = {
  relaxed: 18.6263,
  standard: 15.785,
  generous: 12.8125,
  compact: 11.7875,
};

const MODE_LINE_HEIGHT: Record<ContentFontMode, number> = {
  /** 最大字サイズ＝最もゆったりした行間 */
  relaxed: 1.9,
  standard: 1.8,
  generous: 1.68,
  /** フクロウ読み解きと同じ */
  compact: 1.62,
};

export type DiaryBookEntryV2BodyFontLayout = {
  fontSizePx: number;
  lineHeight: number;
  maxCharsPerLine: number;
  maxLines: number;
  /** 製本1ページに収まる目安字数（chars/行 × 最大行） */
  maxBindingChars: number;
};

function deriveModeFontSizePx(mode: ContentFontMode): number {
  if (mode === "compact") {
    return DIARY_BOOK_ENTRY_V2_COMPACT_FONT_SIZE_PX;
  }
  return (
    DIARY_BOOK_ENTRY_V2_COMPACT_FONT_SIZE_PX *
    (MODE_LEGACY_FONT_SIZE_PX[mode] / LEGACY_COMPACT_FONT_SIZE_PX)
  );
}

export function getDiaryBookEntryV2BodyFontLayout(
  contentFontMode?: string | null,
): DiaryBookEntryV2BodyFontLayout {
  const mode = normalizeContentFontMode(contentFontMode);
  const fontSizePx = Math.round(deriveModeFontSizePx(mode) * 10) / 10;
  const lineHeight = MODE_LINE_HEIGHT[mode];
  const { contentWidthPx, contentHeightPx } = DIARY_BOOK_ENTRY_V2_BODY;
  const maxCharsPerLine = Math.floor(contentWidthPx / fontSizePx);
  const maxLines = Math.max(
    1,
    Math.floor(contentHeightPx / (fontSizePx * lineHeight)),
  );

  return {
    fontSizePx,
    lineHeight,
    maxCharsPerLine,
    maxLines,
    maxBindingChars: maxCharsPerLine * maxLines,
  };
}
