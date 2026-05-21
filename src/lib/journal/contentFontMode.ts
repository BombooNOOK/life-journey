/**
 * 日記「今日の記録」欄の文字サイズモード（DB・API・プレビュー・将来の印刷PDFで共有）
 */

export const CONTENT_FONT_MODES = ["relaxed", "standard", "generous", "compact"] as const;
export type ContentFontMode = (typeof CONTENT_FONT_MODES)[number];

export const DEFAULT_CONTENT_FONT_MODE: ContentFontMode = "standard";

/**
 * モード別の「目安を超えたら注意」（文字数 > この値でソフト警告）。
 * 製本に必ず収まる保証ではなく、読みやすさの目安（後から調整可能）。
 */
export const JOURNAL_CONTENT_SOFT_MAX_BY_MODE: Record<ContentFontMode, number> = {
  relaxed: 120,
  standard: 180,
  generous: 250,
  compact: 320,
};

/**
 * さらに長い場合の警告しきい値（文字数 > この値でストロング警告）。
 * ソフト上限より大きくすること（後から調整可能）。
 */
export const JOURNAL_CONTENT_STRONG_MAX_BY_MODE: Record<ContentFontMode, number> = {
  relaxed: 180,
  standard: 270,
  generous: 380,
  compact: 500,
};

export const CONTENT_FONT_MODE_LABELS_JA: Record<ContentFontMode, string> = {
  relaxed: "ゆったり",
  standard: "標準",
  generous: "たっぷり",
  compact: "ぎゅっと",
};

export const JOURNAL_CONTENT_BOOK_GUIDE_HINT = "製本時に読みやすく残すための目安です";

export const JOURNAL_LONG_CONTENT_WARN_MESSAGE =
  "本文が長めです。製本時に読みやすく仕上げるため、文字サイズを小さくするか、文章を短くしてください。";

export const JOURNAL_VERY_LONG_CONTENT_WARN_MESSAGE =
  "本文がかなり長くなっています。1ページに収まりきらない可能性があります。『ぎゅっと』に変更するか、文章を短くしてください。";

/** 製本イメージプレビュー下の説明（印刷用PDF未実装のため断定しない表現） */
export const PREVIEW_OVERFLOW_HINT_MESSAGE =
  "こちらは製本に近い見え方を確認するためのプレビューです。\n" +
  "長い本文は枠内でスクロールして全文を確認できます。\n" +
  "掲載日・本文・写真は、ご注文前にご自身でご確認ください。\n" +
  "表示内容をもとに製本用データを作成します。";

export function isContentFontMode(value: string): value is ContentFontMode {
  return (CONTENT_FONT_MODES as readonly string[]).includes(value);
}

export function normalizeContentFontMode(raw: string | null | undefined): ContentFontMode {
  const v = typeof raw === "string" ? raw.trim() : "";
  return isContentFontMode(v) ? v : DEFAULT_CONTENT_FONT_MODE;
}

/** 製本イメージ（HTML）のフォント倍率。将来の PDF は mode から別マップを参照 */
export function contentFontModeToPreviewScale(mode: ContentFontMode): number {
  switch (mode) {
    case "relaxed":
      return 1.12;
    case "standard":
      return 1;
    case "generous":
      return 0.9;
    case "compact":
      return 0.76;
    default:
      return 1;
  }
}

export function isJournalContentOverSoftLimit(mode: ContentFontMode, contentLength: number): boolean {
  return contentLength > JOURNAL_CONTENT_SOFT_MAX_BY_MODE[mode];
}

export function isJournalContentStrongLong(mode: ContentFontMode, contentLength: number): boolean {
  return contentLength > JOURNAL_CONTENT_STRONG_MAX_BY_MODE[mode];
}

/**
 * POST/PATCH の JSON から `contentFontMode` を解決する。
 * キー省略・空文字は `standard` 相当の既定。不正な文字列はエラー。
 */
export function resolveContentFontModeFromRequest(
  body: unknown,
): { mode: ContentFontMode } | { error: string } {
  if (typeof body !== "object" || body === null || !("contentFontMode" in body)) {
    return { mode: DEFAULT_CONTENT_FONT_MODE };
  }
  const raw = (body as { contentFontMode: unknown }).contentFontMode;
  if (raw === undefined || raw === null) {
    return { mode: DEFAULT_CONTENT_FONT_MODE };
  }
  if (typeof raw !== "string") {
    return { error: "文字サイズモードの値が不正です。" };
  }
  const t = raw.trim();
  if (!t) {
    return { mode: DEFAULT_CONTENT_FONT_MODE };
  }
  if (!isContentFontMode(t)) {
    return { error: "文字サイズモードの値が不正です。" };
  }
  return { mode: t };
}
