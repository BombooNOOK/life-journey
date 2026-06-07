import type { ContentFontMode } from "@/lib/journal/contentFontMode";
import { DIARY_BODY_CHARS_PER_LINE_BY_MODE } from "@/lib/journal/diaryPreviewBodyLineLimits";
import {
  getDiaryPreviewBodyContentWidthPx,
  getFixedPreviewBodyTextStyle,
} from "@/lib/journal/diaryPreviewFixedLayout";

/** 全角1字 ≒ fontSize の目安幅（Noto Sans JP・製本プレビュー724px座標） */
export function estimateBodyLineWidthPx(
  charsPerLine: number,
  contentFontMode: ContentFontMode,
): number {
  const fontSizePx = parseFloat(getFixedPreviewBodyTextStyle(contentFontMode).fontSize);
  if (!Number.isFinite(fontSizePx)) return 0;
  return charsPerLine * fontSizePx;
}

export function getDiaryPreviewBodyRegionWidthPx(): number {
  return getDiaryPreviewBodyContentWidthPx();
}

/** 右端クリップが起きるかの理論目安（実機は ?bodyLinesDebug=1 で確認） */
export function estimateBodyLineClipsAtRightEdge(
  contentFontMode: ContentFontMode,
  charsPerLine = DIARY_BODY_CHARS_PER_LINE_BY_MODE[contentFontMode],
): {
  bodyWidthPx: number;
  fontSizePx: number;
  charsPerLine: number;
  estimatedLineWidthPx: number;
  likelyClips: boolean;
  maxCharsWithoutClipEstimate: number;
} {
  const bodyWidthPx = getDiaryPreviewBodyRegionWidthPx();
  const fontSizePx = parseFloat(getFixedPreviewBodyTextStyle(contentFontMode).fontSize);
  const estimatedLineWidthPx = estimateBodyLineWidthPx(charsPerLine, contentFontMode);
  const maxCharsWithoutClipEstimate =
    fontSizePx > 0 ? Math.floor(bodyWidthPx / fontSizePx) : 0;
  return {
    bodyWidthPx,
    fontSizePx,
    charsPerLine,
    estimatedLineWidthPx,
    likelyClips: estimatedLineWidthPx > bodyWidthPx + 0.5,
    maxCharsWithoutClipEstimate,
  };
}
