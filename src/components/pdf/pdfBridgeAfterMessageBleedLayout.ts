/** A5 縦（29.7cm）を react-pdf のページ高さ（pt）に合わせる */
const A5_HEIGHT_CM = 29.7;
const A5_HEIGHT_PT = 595.28;
const CM_TO_PT = A5_HEIGHT_PT / A5_HEIGHT_CM;

/** `PdfPageFrame` の `paddingTop` + `pageBody` の上余白 */
const PAGE_CONTENT_TOP_OFFSET_PT = 46;

/** Canva `hon_bridge-after-message` 本文枠（cm） */
const CANVA_BODY_Y_CM = 3.78;
const CANVA_BODY_X_CM = 2.73;
const CANVA_BODY_WIDTH_CM = 15.55;

const PAGE_PADDING_HORIZONTAL_PT = 40;

export function bridgeAfterMessageBodyMarginTopPt(): number {
  return Math.max(0, Math.round(CANVA_BODY_Y_CM * CM_TO_PT - PAGE_CONTENT_TOP_OFFSET_PT));
}

export function bridgeAfterMessageBodyPaddingLeftPt(): number {
  return Math.max(0, Math.round(CANVA_BODY_X_CM * CM_TO_PT - PAGE_PADDING_HORIZONTAL_PT));
}

export function bridgeAfterMessageBodyWidthPt(): number {
  return Math.round(CANVA_BODY_WIDTH_CM * CM_TO_PT);
}
