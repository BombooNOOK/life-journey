/**
 * 日記ブック本文 v2：日付・各セクション見出し（タイトル）用の手書き風フォント定数。
 * 本文・数字・読み解き本文は Noto Sans JP のまま。
 */

/** HTML プレビュー用（Klee One） */
export const DIARY_PREVIEW_LABEL_FONT_FAMILY = '"Klee One", cursive';

/** react-pdf 用（registerFonts で KleeOne として登録） */
export const DIARY_BOOK_ENTRY_V2_LABEL_FONT_FAMILY_PDF = "KleeOne" as const;

export const DIARY_PREVIEW_LABEL_BASE_STYLE = {
  fontFamily: DIARY_PREVIEW_LABEL_FONT_FAMILY,
  fontWeight: 600 as const,
} as const;
