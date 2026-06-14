/**
 * 日記「今日の記録」欄の文字サイズモード（DB・API・プレビュー・将来の印刷PDFで共有）
 */

export const CONTENT_FONT_MODES = ["relaxed", "standard", "generous", "compact"] as const;
export type ContentFontMode = (typeof CONTENT_FONT_MODES)[number];

export const DEFAULT_CONTENT_FONT_MODE: ContentFontMode = "standard";

/** 製本1ページ目安（chars/行 × 最大行・案D行間） */
export const JOURNAL_CONTENT_SOFT_MAX_BY_MODE: Record<ContentFontMode, number> = {
  relaxed: 150,
  standard: 203,
  generous: 360,
  compact: 429,
};

/**
 * さらに長い場合の警告しきい値（ソフト上限の約1.34倍）。
 */
export const JOURNAL_CONTENT_STRONG_MAX_BY_MODE: Record<ContentFontMode, number> = {
  relaxed: 200,
  standard: 272,
  generous: 482,
  compact: 575,
};

export const CONTENT_FONT_MODE_LABELS_JA: Record<ContentFontMode, string> = {
  relaxed: "ゆったり",
  standard: "標準",
  generous: "たっぷり",
  compact: "ぎゅっと",
};

/** 改行1回あたりの軽いレイアウト加算（厳密な行末計算は使わない） */
export const JOURNAL_NEWLINE_LAYOUT_EXTRA_BY_MODE: Record<ContentFontMode, number> = {
  relaxed: 10,
  standard: 10,
  generous: 12,
  compact: 8,
};

/**
 * 本文から毎回再計算する「文字相当」長。
 * 通常の文字数 + 改行ごとの軽い加算（累積や行末の大きな加算はしない）。
 */
export function layoutEquivalentContentLength(
  content: string,
  contentFontMode: string | null | undefined,
): number {
  const normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const mode = normalizeContentFontMode(contentFontMode);
  const perNewline = JOURNAL_NEWLINE_LAYOUT_EXTRA_BY_MODE[mode];
  let chars = 0;
  let newlines = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    if (normalized[i] === "\n") newlines += 1;
    else chars += 1;
  }
  return chars + newlines * perNewline;
}

export const JOURNAL_LONG_CONTENT_WARN_MESSAGE =
  "本文が長めです。製本時に読みやすく仕上げるため、文字サイズを小さくするか、文章を短くしてください。";

export const JOURNAL_VERY_LONG_CONTENT_WARN_MESSAGE =
  "本文がかなり長くなっています。1ページに収まりきらない可能性があります。『ぎゅっと』に変更するか、文章を短くしてください。";

/** 製本イメージプレビュー下の説明（印刷用PDF未実装のため断定しない表現） */
export const PREVIEW_OVERFLOW_HINT_MESSAGE =
  "こちらは、製本したときに1ページに載る見え方を確認するプレビューです。\n" +
  "最大行数を超えた本文は、このページには表示されません（製本にも載りません）。\n" +
  "全文の確認・編集は入力画面で行ってください。\n" +
  "掲載日・本文・写真は、ご注文前にご自身でご確認ください。";

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

/** 製本前確認の長文注意（ソフト＝長め、ストロング＝かなり長い） */
export type JournalContentLengthFlag = "ok" | "soft" | "strong";

export function journalEntryContentLengthFlag(
  contentFontMode: string | null | undefined,
  contentLength: number,
): JournalContentLengthFlag {
  if (contentLength <= 0) return "ok";
  const mode = normalizeContentFontMode(contentFontMode);
  if (isJournalContentStrongLong(mode, contentLength)) return "strong";
  if (isJournalContentOverSoftLimit(mode, contentLength)) return "soft";
  return "ok";
}

/** レイアウト換算長での長文フラグ（一覧・製本前確認用） */
export function journalEntryLayoutLengthFlag(
  contentFontMode: string | null | undefined,
  content: string,
): JournalContentLengthFlag {
  return journalEntryContentLengthFlag(
    contentFontMode,
    layoutEquivalentContentLength(content, contentFontMode),
  );
}

export function entryNeedsLongContentBindingWarning(
  contentFontMode: string | null | undefined,
  content: string,
): boolean {
  return journalEntryLayoutLengthFlag(contentFontMode, content) !== "ok";
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
