import { DIARY_BOOK_ENTRY_V2_COMMENT } from "@/lib/journal/diaryBookEntryPrintLayout";
import {
  DIARY_COMMENT_MAX_LINES,
  getDiaryCommentLinesForBindingAtWidth,
} from "@/lib/journal/diaryPreviewCommentLineWrap";
import {
  resolveDiaryCommentPdfRenderLayout,
  type DiaryCommentPdfRenderLayout,
} from "@/lib/journal/diaryCommentPdfWrap";

/** 日記ブック本文 v2：読み解き欄の行配列（PDF・本棚プレビュー共通） */
export function getDiaryBookEntryV2CommentLayoutLines(text: string): string[] {
  return getDiaryCommentLinesForBindingAtWidth(
    text,
    DIARY_BOOK_ENTRY_V2_COMMENT.contentMaxCharsPerLine,
    { maxLines: DIARY_COMMENT_MAX_LINES },
  );
}

/** 日記ブック本文 v2：読み解き欄の描画レイアウト（PDF・本棚プレビュー共通） */
export function resolveDiaryBookEntryV2CommentRenderLayout(
  text: string,
): DiaryCommentPdfRenderLayout {
  return resolveDiaryCommentPdfRenderLayout(text, {
    baseFontSizePx: DIARY_BOOK_ENTRY_V2_COMMENT.contentFontSizePx,
    regionHeightPx: DIARY_BOOK_ENTRY_V2_COMMENT.contentHeightPx,
    maxCharsPerLine: DIARY_BOOK_ENTRY_V2_COMMENT.contentMaxCharsPerLine,
  });
}
