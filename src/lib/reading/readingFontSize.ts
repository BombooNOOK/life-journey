/** 画面読み物の文字サイズ（製本イメージには反映しない） */

export const READING_FONT_SIZES = ["normal", "large", "xLarge"] as const;

export type ReadingFontSize = (typeof READING_FONT_SIZES)[number];

export const DEFAULT_READING_FONT_SIZE: ReadingFontSize = "normal";

export const READING_FONT_SIZE_STORAGE_KEY = "ljd-reading-font-size" as const;

export const READING_FONT_SIZE_LABELS: Record<ReadingFontSize, string> = {
  normal: "ふつう",
  large: "大きめ",
  xLarge: "もっと大きめ",
};

export function readingFontSizeToDataAttribute(size: ReadingFontSize): string {
  if (size === "xLarge") return "x-large";
  return size;
}

export function normalizeReadingFontSize(value: unknown): ReadingFontSize {
  if (value === "large" || value === "xLarge") return value;
  if (value === "x-large") return "xLarge";
  return DEFAULT_READING_FONT_SIZE;
}

export function resolveInitialReadingFontSize(
  stored: ReadingFontSize | null,
): ReadingFontSize {
  return stored ?? DEFAULT_READING_FONT_SIZE;
}
