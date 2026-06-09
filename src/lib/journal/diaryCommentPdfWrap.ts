import {
  collapsePdfBodyFlowText,
  splitFixedWidthJapaneseLines,
} from "@/lib/pdf/splitFixedWidthJapaneseLines";

/** 読み解き欄の1行最大文字数（14px・右余白6px・overflow非クリップ前提で24文字） */
export const DIARY_COMMENT_PDF_CHARS_PER_LINE = 24;

/** 本文スロット高さ 173px・lineHeight≈1.58 の近似 */
export const DIARY_COMMENT_PDF_MAX_LINES = 8;

export const DIARY_COMMENT_PDF_REGION_HEIGHT_PX = 173;

const COMMENT_LAYOUT_TIERS = [
  { fontScale: 0.97, lineHeight: 1.66 },
  { fontScale: 0.93, lineHeight: 1.6 },
  { fontScale: 0.88, lineHeight: 1.54 },
] as const;

/** PDF：段落・改行・不可視文字を潰して1文として流す */
export const normalizeDiaryCommentForPdfFlow = collapsePdfBodyFlowText;

export const splitDiaryCommentPdfFixedWidthLines = (
  text: string,
  maxChars: number = DIARY_COMMENT_PDF_CHARS_PER_LINE,
): string[] => splitFixedWidthJapaneseLines(text, maxChars);

export function getDiaryCommentPdfLinesForBinding(text: string): string[] {
  return splitDiaryCommentPdfFixedWidthLines(text);
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
  },
): DiaryCommentPdfRenderLayout {
  const lines = getDiaryCommentPdfLinesForBinding(text);
  const baseFontSizePx = options?.baseFontSizePx ?? 12;
  const regionHeightPx = options?.regionHeightPx ?? DIARY_COMMENT_PDF_REGION_HEIGHT_PX;

  for (const tier of COMMENT_LAYOUT_TIERS) {
    const fontSizePx = baseFontSizePx * tier.fontScale;
    const lineBlockPx = fontSizePx * tier.lineHeight;
    if (lines.length * lineBlockPx <= regionHeightPx + 1) {
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
    overflows: lines.length > DIARY_COMMENT_PDF_MAX_LINES,
  };
}

export function isDiaryCommentOverPdfLineLimit(text: string): boolean {
  return resolveDiaryCommentPdfRenderLayout(text).overflows;
}
