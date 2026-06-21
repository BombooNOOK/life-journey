import {
  DIARY_BOOK_ENTRY_V2_COMMENT,
  DIARY_BOOK_ENTRY_V2_COMMENT_LINE_SCHEDULE,
  DIARY_BOOK_ENTRY_V2_COMMENT_RENDER_OPTIONS,
} from "@/lib/journal/diaryBookEntryPrintLayout";
import {
  DIARY_COMMENT_MAX_LINES,
  getDiaryCommentLinesForBindingAtSchedule,
} from "@/lib/journal/diaryPreviewCommentLineWrap";
import {
  resolveDiaryCommentPdfRenderLayout,
  type DiaryCommentPdfRenderLayout,
} from "@/lib/journal/diaryCommentPdfWrap";

/** 日記ブック本文 v2：読み解き欄の行配列（PDF・プレビュー共通） */
export function getDiaryBookEntryV2CommentLayoutLines(text: string): string[] {
  return getDiaryCommentLinesForBindingAtSchedule(
    text,
    DIARY_BOOK_ENTRY_V2_COMMENT_LINE_SCHEDULE,
    {
      maxLines: DIARY_COMMENT_MAX_LINES,
      fallbackMaxCharsPerLine: DIARY_BOOK_ENTRY_V2_COMMENT.contentMaxCharsPerLine,
    },
  );
}

/** 日記ブック本文 v2：読み解き欄の描画レイアウト（PDF・プレビュー共通） */
export function resolveDiaryBookEntryV2CommentRenderLayout(
  text: string,
): DiaryCommentPdfRenderLayout {
  return resolveDiaryCommentPdfRenderLayout(text, DIARY_BOOK_ENTRY_V2_COMMENT_RENDER_OPTIONS);
}

export function isDiaryBookEntryV2CommentOverLineLimit(text: string): boolean {
  return resolveDiaryBookEntryV2CommentRenderLayout(text).overflows;
}
