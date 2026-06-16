import {
  normalizeReadingFontSize,
  READING_FONT_SIZE_STORAGE_KEY,
  type ReadingFontSize,
} from "@/lib/reading/readingFontSize";

export function readReadingFontSizeFromStorage(): ReadingFontSize | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(READING_FONT_SIZE_STORAGE_KEY);
    if (!raw) return null;
    return normalizeReadingFontSize(raw);
  } catch {
    return null;
  }
}

export function writeReadingFontSizeToStorage(size: ReadingFontSize): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(READING_FONT_SIZE_STORAGE_KEY, size);
  } catch {
    /* quota / private mode */
  }
}
