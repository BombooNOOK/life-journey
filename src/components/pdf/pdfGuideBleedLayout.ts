/** A5 縦（29.7cm）を react-pdf のページ高さ（pt）に合わせる */
const A5_HEIGHT_CM = 29.7;
const A5_HEIGHT_PT = 595.28;
const CM_TO_PT = A5_HEIGHT_PT / A5_HEIGHT_CM;

/** `PdfPageFrame` の `paddingTop` + `pageBody` の上余白（タイトル開始位置の換算用） */
const PAGE_CONTENT_TOP_OFFSET_PT = 46;

/** Canva「LP place」タイトル枠（cm） */
const CANVA_TITLE_Y_CM = 3.34;

/** Canva「lphbplace」本文テキスト枠（cm） */
const CANVA_BODY_Y_CM = 6.12;
const CANVA_BODY_X_CM = 2.73;

const PAGE_PADDING_HORIZONTAL_PT = 40;

/** Canva テキスト色（fontcolor） */
export const PDF_GUIDE_TEXT_COLOR = "#545454";

/** 他ページの生成文字とのバランス（Canva 26pt よりやや抑える） */
export const PDF_GUIDE_TITLE_FONT_SIZE = 22;

/** 最長行（「あなたがこの人生を…」）を1行に収めるための最小幅（pt） */
export const PDF_GUIDE_BODY_NO_WRAP_MIN_WIDTH_PT = 368;

export function numberGuideBleedContentMarginTopPt(): number {
  return Math.round(CANVA_TITLE_Y_CM * CM_TO_PT - PAGE_CONTENT_TOP_OFFSET_PT);
}

export function numberGuideBleedBodyMarginTopPt(): number {
  const titleTop = CANVA_TITLE_Y_CM * CM_TO_PT;
  const bodyTop = CANVA_BODY_Y_CM * CM_TO_PT;
  const titleBlock = PDF_GUIDE_TITLE_FONT_SIZE * 1.35;
  /** 1 ページ収め時は Canva 値よりやや詰める（原稿の句読点改行で縦が伸びるため） */
  return Math.max(20, Math.round(bodyTop - titleTop - titleBlock) - 6);
}

export function numberGuideBleedContentPaddingLeftPt(): number {
  return Math.max(0, Math.round(CANVA_BODY_X_CM * CM_TO_PT - PAGE_PADDING_HORIZONTAL_PT));
}
