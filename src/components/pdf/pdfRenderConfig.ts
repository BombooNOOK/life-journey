import type { Style } from "@react-pdf/types";

export type BodyFontFamily = "NotoSansJP";
export type FocusPage = "all" | "lifePath" | "bridge" | "personalYear";
export type BodyTuneStep = "normal" | "step1" | "step2" | "step3";

export interface PdfRenderConfig {
  bodyFontFamily?: BodyFontFamily;
  bodyFontSize?: number;
  bodyLineHeight?: number;
  /** 本文ブロックだけ左右マージンを減らして横幅を広げる */
  bodyExpandWidth?: number;
  focusPage?: FocusPage;
}

export interface BodyRenderOverrides {
  bodyStyle?: Style;
  bodyExpandWidth?: number;
}

export function bodyStyleFromConfig(config: PdfRenderConfig): Style | undefined {
  const style: Record<string, number | string> = {};
  if (config.bodyFontFamily) style.fontFamily = config.bodyFontFamily;
  if (typeof config.bodyFontSize === "number") style.fontSize = config.bodyFontSize;
  if (typeof config.bodyLineHeight === "number") style.lineHeight = config.bodyLineHeight;
  return Object.keys(style).length > 0 ? (style as Style) : undefined;
}
