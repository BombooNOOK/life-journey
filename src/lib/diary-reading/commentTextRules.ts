/**
 * 読み解きコメントのテキスト出力ルール。
 * テンプレート原稿作成・generateDiaryReading の結合・保存時正規化で共通参照。
 */
export const DIARY_READING_COMMENT_OUTPUT_RULES = `
【テキスト出力に関する厳格なルール】
- 単語の途中や文の途中で改行コード（\\n）を絶対に入れない
- 原稿テンプレート内では改行を入れない（ひと続きの文字列）
- base文と末尾アクセント文の結合時のみ、ブロック境界に \\n を1つ入れる（PDFでアクセントから改行）
- 句点ごとの改行は入れない（行数オーバーになるため）
- 画面幅に合わせた折り返しはアプリ側（CSS / PDF）で行う
`.trim();

/** base 本文と末尾アクセントの区切り（DB・PDF 共通・最大1つ） */
export const DIARY_READING_COMMENT_BLOCK_SEPARATOR = "\n";

export function normalizeDiaryReadingSegment(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n+/g, " ")
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * base + accent を結合。アクセントがあるときだけブロック境界に \\n を1つ入れる。
 */
export function joinDiaryReadingCommentParts(
  ...parts: Array<string | undefined | null>
): string {
  const segments = parts
    .filter((part): part is string => Boolean(part?.trim()))
    .map(normalizeDiaryReadingSegment);
  if (segments.length === 0) return "";
  if (segments.length === 1) return segments[0];
  return `${segments[0]}${DIARY_READING_COMMENT_BLOCK_SEPARATOR}${segments.slice(1).join(" ")}`;
}
