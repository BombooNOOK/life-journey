/** A5 縦（29.7cm）を react-pdf のページ高さ（pt）に合わせる */
const A5_HEIGHT_CM = 29.7;
const A5_HEIGHT_PT = 595.28;
const CM_TO_PT = A5_HEIGHT_PT / A5_HEIGHT_CM;

/** Canva 中表紙テキスト枠（`inside` / 表紙 `cover02` と同文） */
const CANVA_INSIDE_COVER_TEXT_Y_CM = 12.94;
/** 月・フクロウの下：for 名 / Born on …（暫定。Canva 確定後に差し替え可） */
const CANVA_INSIDE_COVER_RECIPIENT_Y_CM = 17.35;
const CANVA_INSIDE_COVER_TEXT_X_CM = 2.1;
const CANVA_INSIDE_COVER_TEXT_WIDTH_CM = 16.8;
const CANVA_INSIDE_COVER_TEXT_HEIGHT_CM = 0.99;
const CANVA_INSIDE_COVER_RECIPIENT_HEIGHT_CM = 2.4;

/** 表紙サブタイトルと同サイズ（Canva 24 → PDF 調整済み） */
export { PDF_COVER_SUBTITLE_FONT_SIZE as PDF_INSIDE_COVER_TEXT_FONT_SIZE } from "./pdfCoverBleedLayout";
export { PDF_COVER_TEXT_COLOR as PDF_INSIDE_COVER_TEXT_COLOR } from "./pdfCoverBleedLayout";

function canvaYToTopPt(yCm: number): number {
  return Math.max(0, Math.round(yCm * CM_TO_PT));
}

function canvaXToLeftPt(xCm: number): number {
  return Math.max(0, Math.round(xCm * CM_TO_PT));
}

function cmToPt(cm: number): number {
  return Math.round(cm * CM_TO_PT);
}

export function insideCoverTextBoxStyle() {
  const h = cmToPt(CANVA_INSIDE_COVER_TEXT_HEIGHT_CM);
  return {
    position: "absolute" as const,
    top: canvaYToTopPt(CANVA_INSIDE_COVER_TEXT_Y_CM),
    left: canvaXToLeftPt(CANVA_INSIDE_COVER_TEXT_X_CM),
    width: cmToPt(CANVA_INSIDE_COVER_TEXT_WIDTH_CM),
    maxWidth: cmToPt(CANVA_INSIDE_COVER_TEXT_WIDTH_CM),
    height: h,
    maxHeight: h,
    justifyContent: "center" as const,
  };
}

/** 中表紙：鑑定対象者名・生年月日（控えめ） */
export const PDF_INSIDE_COVER_RECIPIENT_FONT_SIZE = 11;

export function insideCoverRecipientBoxStyle() {
  const h = cmToPt(CANVA_INSIDE_COVER_RECIPIENT_HEIGHT_CM);
  return {
    position: "absolute" as const,
    top: canvaYToTopPt(CANVA_INSIDE_COVER_RECIPIENT_Y_CM),
    left: canvaXToLeftPt(CANVA_INSIDE_COVER_TEXT_X_CM),
    width: cmToPt(CANVA_INSIDE_COVER_TEXT_WIDTH_CM),
    maxWidth: cmToPt(CANVA_INSIDE_COVER_TEXT_WIDTH_CM),
    minHeight: h,
    alignItems: "center" as const,
    justifyContent: "flex-start" as const,
  };
}
