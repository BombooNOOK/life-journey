import { PDF_GUIDE_TEXT_COLOR } from "./pdfGuideBleedLayout";

/** A5 縦（29.7cm）を react-pdf のページ高さ（pt）に合わせる */
const A5_HEIGHT_CM = 29.7;
const A5_HEIGHT_PT = 595.28;
const CM_TO_PT = A5_HEIGHT_PT / A5_HEIGHT_CM;

/** `PdfPageFrame` の `paddingTop` + `pageBody` の上余白 */
const PAGE_CONTENT_TOP_OFFSET_PT = 46;

const PAGE_PADDING_HORIZONTAL_PT = 40;

/** Canva `46_ue` 上段本文枠 */
const CANVA_UPPER_BODY_Y_CM = 3.78;
const CANVA_UPPER_BODY_X_CM = 2.73;
const CANVA_UPPER_BODY_WIDTH_CM = 15.55;
const CANVA_UPPER_BODY_HEIGHT_CM = 9.01;

/** Canva `46_shita` 下段本文枠 */
const CANVA_LOWER_BODY_Y_CM = 14.85;
const CANVA_LOWER_BODY_X_CM = 2.55;
const CANVA_LOWER_BODY_WIDTH_CM = 15.9;

/** 上段（通常本文） */
export const PDF_AFTER_MESSAGE_UPPER_FONT_SIZE = 11.5;

/** 下段（箇条書き・Canva より約 1pt 小さめ） */
export const PDF_AFTER_MESSAGE_LOWER_FONT_SIZE = 10.5;

export { PDF_GUIDE_TEXT_COLOR as PDF_AFTER_MESSAGE_TEXT_COLOR };

/** 下段箇条書きの行間（`PdfLongFormBody` の `sentenceLineGap`） */
export const PDF_AFTER_MESSAGE_LOWER_SENTENCE_LINE_GAP = 7;

export function personalYearAfterMessageUpperMarginTopPt(): number {
  return Math.max(0, Math.round(CANVA_UPPER_BODY_Y_CM * CM_TO_PT - PAGE_CONTENT_TOP_OFFSET_PT));
}

export function personalYearAfterMessageUpperPaddingLeftPt(): number {
  return Math.max(0, Math.round(CANVA_UPPER_BODY_X_CM * CM_TO_PT - PAGE_PADDING_HORIZONTAL_PT));
}

export function personalYearAfterMessageUpperWidthPt(): number {
  return Math.round(CANVA_UPPER_BODY_WIDTH_CM * CM_TO_PT);
}

/** 上段枠の下端から下段枠の上端まで（Canva 縦位置の差） */
export function personalYearAfterMessageLowerGapMarginTopPt(): number {
  const gapCm = CANVA_LOWER_BODY_Y_CM - CANVA_UPPER_BODY_Y_CM - CANVA_UPPER_BODY_HEIGHT_CM;
  return Math.max(0, Math.round(gapCm * CM_TO_PT));
}

export function personalYearAfterMessageLowerPaddingLeftPt(): number {
  return Math.max(0, Math.round(CANVA_LOWER_BODY_X_CM * CM_TO_PT - PAGE_PADDING_HORIZONTAL_PT));
}

export function personalYearAfterMessageLowerWidthPt(): number {
  return Math.round(CANVA_LOWER_BODY_WIDTH_CM * CM_TO_PT);
}
