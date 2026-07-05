/** 未ログイン向け：文字サイズの単品ページ */
export const READING_FONT_SIZE_PAGE_PATH = "/settings/reading-font-size" as const;

/** 同一オリジン内の相対パスのみ許可（オープンリダイレクト防止） */
export function resolveSafeReadingFontSizeReturnTo(
  raw: string | null | undefined,
  fallback = "/",
): string {
  if (!raw?.trim()) return fallback;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback;
  return trimmed;
}

export function buildReadingFontSizePagePath(returnTo?: string | null): string {
  if (!returnTo?.trim()) return READING_FONT_SIZE_PAGE_PATH;
  const safe = resolveSafeReadingFontSizeReturnTo(returnTo, "");
  if (!safe) return READING_FONT_SIZE_PAGE_PATH;
  return `${READING_FONT_SIZE_PAGE_PATH}?returnTo=${encodeURIComponent(safe)}`;
}

/** クライアント：現在の画面を returnTo に含めて遷移先 URL を組み立てる */
export function buildReadingFontSizePageHref(returnTo?: string | null): string {
  if (returnTo?.trim()) return buildReadingFontSizePagePath(returnTo);
  if (typeof window !== "undefined") {
    return buildReadingFontSizePagePath(`${window.location.pathname}${window.location.search}`);
  }
  return READING_FONT_SIZE_PAGE_PATH;
}

export function parseReadingFontSizeReturnTo(raw: string | null | undefined): string {
  return resolveSafeReadingFontSizeReturnTo(raw, "/");
}
