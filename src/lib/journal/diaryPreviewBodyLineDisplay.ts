import type { CSSProperties } from "react";

/** 本文行コンテナ：子行の再折り返しをさせない */
export const DIARY_PREVIEW_BODY_LINES_CONTAINER_STYLE: CSSProperties = {
  display: "block",
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  wordBreak: "normal",
  overflowWrap: "normal",
  WebkitHyphens: "none",
  hyphens: "none",
};

/** 本文1行：論理行＝表示行（二次折り返し禁止・右端クリップ） */
export const DIARY_PREVIEW_BODY_LINE_BASE_STYLE: CSSProperties = {
  display: "block",
  width: "100%",
  maxWidth: "100%",
  margin: 0,
  padding: 0,
  boxSizing: "border-box",
  whiteSpace: "pre",
  wordBreak: "normal",
  overflowWrap: "normal",
  WebkitHyphens: "none",
  hyphens: "none",
  overflow: "hidden",
  overflowX: "clip",
  textOverflow: "clip",
  flexShrink: 0,
  WebkitTextSizeAdjust: "100%",
  textSizeAdjust: "100%",
};

/** 読み解き1行：行末の1文字が横クリップされないよう overflow を付けない */
export const DIARY_PREVIEW_COMMENT_LINE_BASE_STYLE: CSSProperties = {
  display: "block",
  width: "100%",
  maxWidth: "100%",
  margin: 0,
  padding: 0,
  boxSizing: "border-box",
  whiteSpace: "pre",
  wordBreak: "normal",
  overflowWrap: "normal",
  WebkitHyphens: "none",
  hyphens: "none",
  flexShrink: 0,
  WebkitTextSizeAdjust: "100%",
  textSizeAdjust: "100%",
};

export function getDiaryPreviewCommentLineStyle(
  commentTextStyle: { fontSize: string; lineHeight: string },
): CSSProperties {
  return {
    ...DIARY_PREVIEW_COMMENT_LINE_BASE_STYLE,
    fontSize: commentTextStyle.fontSize,
    lineHeight: commentTextStyle.lineHeight,
  };
}

export function getDiaryPreviewBodyLineStyle(
  bodyTextStyle: { fontSize: string; lineHeight: string },
  options?: { debugVisual?: boolean; lineIndex?: number },
): CSSProperties {
  const fontSizePx = parseFloat(bodyTextStyle.fontSize);
  const lineHeightRatio = parseFloat(bodyTextStyle.lineHeight);
  const lineBoxPx =
    Number.isFinite(fontSizePx) && Number.isFinite(lineHeightRatio)
      ? fontSizePx * lineHeightRatio
      : undefined;

  const style: CSSProperties = {
    ...DIARY_PREVIEW_BODY_LINE_BASE_STYLE,
    fontSize: bodyTextStyle.fontSize,
    lineHeight: bodyTextStyle.lineHeight,
  };

  if (lineBoxPx !== undefined) {
    const h = `${lineBoxPx}px`;
    style.height = h;
    style.minHeight = h;
    style.maxHeight = h;
  }

  if (options?.debugVisual) {
    const i = options.lineIndex ?? 0;
    style.backgroundColor = i % 2 === 0 ? "rgba(120, 53, 15, 0.1)" : "rgba(120, 53, 15, 0.05)";
    style.borderBottom = "1px dashed rgba(120, 53, 15, 0.28)";
  }

  return style;
}
