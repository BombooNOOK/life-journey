import { DIARY_BOOK_ENTRY_V2_COMMENT } from "@/lib/journal/diaryBookEntryPrintLayout";

export type DiaryBookEntryV2CommentFontLayout = {
  fontSizePx: number;
  lineHeight: number;
  wrapWidthPx: number;
  maxCharsPerLine: number;
  maxLines: number;
  regionHeightPx: number;
};

/** 読み解き欄：本文「ぎゅっと」と同じ 15px / 1.62。枠幅は伴走キャラ手前まで使う。 */
export function getDiaryBookEntryV2CommentFontLayout(): DiaryBookEntryV2CommentFontLayout {
  const {
    contentWidthPx,
    contentPaddingRightPx,
    contentHeightPx,
    contentFontSizePx,
    contentLineHeight,
  } = DIARY_BOOK_ENTRY_V2_COMMENT;
  const wrapWidthPx = contentWidthPx - contentPaddingRightPx;
  const maxCharsPerLine = Math.floor(wrapWidthPx / contentFontSizePx);
  const maxLines = Math.max(
    1,
    Math.floor(contentHeightPx / (contentFontSizePx * contentLineHeight)),
  );

  return {
    fontSizePx: contentFontSizePx,
    lineHeight: contentLineHeight,
    wrapWidthPx,
    maxCharsPerLine,
    maxLines,
    regionHeightPx: contentHeightPx,
  };
}
