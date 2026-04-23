/**
 * 鑑定書の長文本文で共通（ライフパスと同じルール）。
 * - 「。」のあと改行・空行区切りで文脈が変わるところは余白を広げる → PdfLongFormBody 内部
 * - 見出し直下の本文先頭・続きページ上余白は各所でスプレッド
 */
export const PDF_LONG_FORM_FIRST_MARGIN_TOP = 18;
export const PDF_LONG_FORM_PARAGRAPH_GAP = 12;
export const PDF_LONG_FORM_MAJOR_BLOCK_EXTRA_GAP = 10;
/** 一般的な長文（続きページの上余白） */
export const PDF_LONG_FORM_CONTINUATION_TOP_GAP = 32;
/**
 * ライフパス「基本」・ディスティニー本文など、同一ブロックの 2 ページ目以降だけやや広めに取る（約 1〜2 行分）。
 * ※ `break` 後の別セクション先頭では `continuationPageTopGap: 0` などで使わないこと。
 */
export const PDF_LONG_FORM_CONTINUATION_TOP_GAP_TALL = 54;

/** コアナンバー本文のまとまりにそのまま渡す props */
export const pdfLongFormProseProps = {
  firstParagraphMarginTop: PDF_LONG_FORM_FIRST_MARGIN_TOP,
  paragraphGap: PDF_LONG_FORM_PARAGRAPH_GAP,
  majorBlockExtraGap: PDF_LONG_FORM_MAJOR_BLOCK_EXTRA_GAP,
  continuationPageTopGap: PDF_LONG_FORM_CONTINUATION_TOP_GAP,
} as const;

/** 「基本」単体・ディスティニー単体など、続きページの開始位置をやや下げたいブロック向け */
export const pdfLongFormProsePropsWithTallContinuation = {
  ...pdfLongFormProseProps,
  continuationPageTopGap: PDF_LONG_FORM_CONTINUATION_TOP_GAP_TALL,
} as const;
