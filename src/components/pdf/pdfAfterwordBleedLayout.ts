import type { AfterwordPageKey } from "@/lib/numerology/pdfAfterwordCopy";

/** A5 縦（29.7cm）を react-pdf のページ高さ（pt）に合わせる */
const A5_HEIGHT_CM = 29.7;
const A5_HEIGHT_PT = 595.28;
const CM_TO_PT = A5_HEIGHT_PT / A5_HEIGHT_CM;

/** `PdfPageFrame` の `paddingTop` + `pageBody` の上余白 */
const PAGE_CONTENT_TOP_OFFSET_PT = 46;

/** Canva `last_title` */
const CANVA_AFTERWORD_TITLE_Y_CM = 3.34;
const CANVA_AFTERWORD_TITLE_X_CM = 2.1;

/** Canva `last_hon1` / `last_hon2` 本文枠の上端 */
const CANVA_AFTERWORD_BODY_Y_CM = 6.12;

/** Canva `last_hon1` 左P */
const CANVA_AFTERWORD_LEFT_BODY_X_CM = 2.73;
const CANVA_AFTERWORD_LEFT_BODY_WIDTH_CM = 15.55;

/** Canva `last_hon2` 右P */
const CANVA_AFTERWORD_RIGHT_BODY_X_CM = 2.86;
const CANVA_AFTERWORD_RIGHT_BODY_WIDTH_CM = 15.29;

const PAGE_PADDING_HORIZONTAL_PT = 40;

/** タイトル 22pt bold（はじめに・ナンバー「とは」と同じ） */
export const PDF_AFTERWORD_TITLE_FONT_SIZE = 22;

export function afterwordBleedContentMarginTopPt(pageKey: AfterwordPageKey): number {
  if (pageKey === "right") {
    return Math.round(CANVA_AFTERWORD_BODY_Y_CM * CM_TO_PT - PAGE_CONTENT_TOP_OFFSET_PT);
  }
  return Math.round(CANVA_AFTERWORD_TITLE_Y_CM * CM_TO_PT - PAGE_CONTENT_TOP_OFFSET_PT);
}

export function afterwordBleedBodyMarginTopPt(): number {
  const titleTop = CANVA_AFTERWORD_TITLE_Y_CM * CM_TO_PT;
  const bodyTop = CANVA_AFTERWORD_BODY_Y_CM * CM_TO_PT;
  const titleBlock = PDF_AFTERWORD_TITLE_FONT_SIZE * 1.35;
  return Math.max(20, Math.round(bodyTop - titleTop - titleBlock) - 6);
}

export function afterwordBleedContentPaddingLeftPt(pageKey: AfterwordPageKey): number {
  const xCm = pageKey === "right" ? CANVA_AFTERWORD_RIGHT_BODY_X_CM : CANVA_AFTERWORD_LEFT_BODY_X_CM;
  return Math.max(0, Math.round(xCm * CM_TO_PT - PAGE_PADDING_HORIZONTAL_PT));
}

export function afterwordBleedBodyWidthPt(pageKey: AfterwordPageKey): number {
  const cm =
    pageKey === "right" ? CANVA_AFTERWORD_RIGHT_BODY_WIDTH_CM : CANVA_AFTERWORD_LEFT_BODY_WIDTH_CM;
  return Math.round(cm * CM_TO_PT);
}
