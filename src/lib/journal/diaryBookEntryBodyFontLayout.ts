import {
  normalizeContentFontMode,
  type ContentFontMode,
} from "@/lib/journal/contentFontMode";
import { DIARY_BOOK_ENTRY_V2_BODY } from "@/lib/journal/diaryBookEntryPrintLayout";

/** 1055×1491 設計 → 724×1024 換算の本文フォント（チャッピーくん座標） */
const MODE_FONT_SIZE_PX: Record<ContentFontMode, number> = {
  relaxed: 24,
  standard: 20,
  generous: 16,
  compact: 15,
};

const MODE_LINE_HEIGHT: Record<ContentFontMode, number> = {
  relaxed: 1.9,
  standard: 1.75,
  generous: 1.68,
  compact: 1.62,
};

/**
 * 理論行数（枠高÷行高の floor）から引く製本余白。
 * プレビュー・PDF で下端にはみ出し気味になる分を吸収する。
 */
const BINDING_MAX_LINES_SAFETY_MARGIN = 1;

/** v2 最小＝ぎゅっとモード */
export const DIARY_BOOK_ENTRY_V2_COMPACT_FONT_SIZE_PX = MODE_FONT_SIZE_PX.compact;

export type DiaryBookEntryV2BodyFontLayout = {
  fontSizePx: number;
  lineHeight: number;
  maxCharsPerLine: number;
  maxLines: number;
  /** 製本1ページに収まる目安字数（chars/行 × 最大行） */
  maxBindingChars: number;
};

export function getDiaryBookEntryV2BodyFontLayout(
  contentFontMode?: string | null,
): DiaryBookEntryV2BodyFontLayout {
  const mode = normalizeContentFontMode(contentFontMode);
  const fontSizePx = MODE_FONT_SIZE_PX[mode];
  const lineHeight = MODE_LINE_HEIGHT[mode];
  const { contentWidthPx, contentHeightPx } = DIARY_BOOK_ENTRY_V2_BODY;
  const maxCharsPerLine = Math.floor(contentWidthPx / fontSizePx);
  const maxLines = Math.max(
    1,
    Math.floor(contentHeightPx / (fontSizePx * lineHeight)) - BINDING_MAX_LINES_SAFETY_MARGIN,
  );

  return {
    fontSizePx,
    lineHeight,
    maxCharsPerLine,
    maxLines,
    maxBindingChars: maxCharsPerLine * maxLines,
  };
}
