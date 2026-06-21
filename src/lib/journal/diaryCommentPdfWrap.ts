import {
  DIARY_BOOK_ENTRY_V2_COMMENT,
  DIARY_BOOK_ENTRY_V2_COMMENT_RENDER_OPTIONS,
} from "./diaryBookEntryPrintLayout";
import {
  DIARY_COMMENT_MAX_LINES,
  getDiaryCommentLinesForBindingAtSchedule,
  getDiaryCommentLinesForBindingAtWidth,
  normalizeDiaryCommentForPdfFlow,
} from "./diaryPreviewCommentLineWrap";

/** 読み解き欄の1行最大文字数（日記ブック v2 レイアウトと同期） */
export const DIARY_COMMENT_PDF_CHARS_PER_LINE =
  DIARY_BOOK_ENTRY_V2_COMMENT.contentMaxCharsPerLine;

/** 読み解き欄スロット高さ（日記ブック v2 レイアウトと同期） */
export const DIARY_COMMENT_PDF_REGION_HEIGHT_PX =
  DIARY_BOOK_ENTRY_V2_COMMENT.contentHeightPx;

export const DIARY_COMMENT_PDF_MAX_LINES = DIARY_COMMENT_MAX_LINES;

const COMMENT_LAYOUT_TIERS = [
  { fontScale: 1, lineHeight: DIARY_BOOK_ENTRY_V2_COMMENT.contentLineHeight },
  { fontScale: 0.97, lineHeight: 1.58 },
  { fontScale: 0.93, lineHeight: 1.5 },
  { fontScale: 0.88, lineHeight: 1.44 },
] as const;

export { normalizeDiaryCommentForPdfFlow } from "./diaryPreviewCommentLineWrap";

export function getDiaryCommentPdfLinesForBinding(text: string): string[] {
  return getDiaryCommentLinesForBindingAtWidth(text, DIARY_COMMENT_PDF_CHARS_PER_LINE, {
    maxLines: DIARY_COMMENT_PDF_MAX_LINES,
  });
}

export type DiaryCommentPdfRenderLayout = {
  lines: string[];
  fontScale: number;
  lineHeight: number;
  overflows: boolean;
};

export function resolveDiaryCommentPdfRenderLayout(
  text: string,
  options?: {
    baseFontSizePx?: number;
    regionHeightPx?: number;
    maxCharsPerLine?: number;
    maxCharsPerLineSchedule?: readonly number[];
  },
): DiaryCommentPdfRenderLayout {
  const maxCharsPerLine =
    options?.maxCharsPerLine ?? DIARY_COMMENT_PDF_CHARS_PER_LINE;
  const normalized = normalizeDiaryCommentForPdfFlow(text);
  const lines = options?.maxCharsPerLineSchedule
    ? getDiaryCommentLinesForBindingAtSchedule(text, options.maxCharsPerLineSchedule, {
        maxLines: DIARY_COMMENT_PDF_MAX_LINES,
        fallbackMaxCharsPerLine: maxCharsPerLine,
      })
    : getDiaryCommentLinesForBindingAtWidth(text, maxCharsPerLine, {
        maxLines: DIARY_COMMENT_PDF_MAX_LINES,
      });
  const textIntact = lines.join("") === normalized;
  const baseFontSizePx = options?.baseFontSizePx ?? DIARY_BOOK_ENTRY_V2_COMMENT.contentFontSizePx;
  const regionHeightPx = options?.regionHeightPx ?? DIARY_COMMENT_PDF_REGION_HEIGHT_PX;

  for (const tier of COMMENT_LAYOUT_TIERS) {
    const fontSizePx = baseFontSizePx * tier.fontScale;
    const lineBlockPx = fontSizePx * tier.lineHeight;
    if (textIntact && lines.length * lineBlockPx <= regionHeightPx + 1) {
      return {
        lines,
        fontScale: tier.fontScale,
        lineHeight: tier.lineHeight,
        overflows: false,
      };
    }
  }

  const lastTier = COMMENT_LAYOUT_TIERS[COMMENT_LAYOUT_TIERS.length - 1];
  return {
    lines,
    fontScale: lastTier.fontScale,
    lineHeight: lastTier.lineHeight,
    overflows: !textIntact || lines.length > DIARY_COMMENT_PDF_MAX_LINES,
  };
}

export function isDiaryCommentOverPdfLineLimit(text: string): boolean {
  return resolveDiaryCommentPdfRenderLayout(
    text,
    DIARY_BOOK_ENTRY_V2_COMMENT_RENDER_OPTIONS,
  ).overflows;
}
