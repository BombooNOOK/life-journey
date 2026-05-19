import type { IntroductionPageKey } from "@/lib/numerology/pdfIntroductionCopy";

/** A5 縦（29.7cm）を react-pdf のページ高さ（pt）に合わせる */
const A5_HEIGHT_CM = 29.7;
const A5_HEIGHT_PT = 595.28;
const CM_TO_PT = A5_HEIGHT_PT / A5_HEIGHT_CM;

/** `PdfPageFrame` の `paddingTop` + `pageBody` の上余白 */
const PAGE_CONTENT_TOP_OFFSET_PT = 46;

/** Canva `title_haji` / `title_anga`（はじめに 1P・2P タイトル枠・同一） */
const CANVA_INTRO_TITLE_Y_CM = 3.34;
const CANVA_INTRO_TITLE_X_CM = 2.1;

/** Canva 本文枠の上端・左端（`hon_haji` / `hon_an` 共通） */
const CANVA_INTRO_BODY_Y_CM = 6.12;
const CANVA_INTRO_BODY_X_CM = 2.73;

/** Canva `hon_haji`（はじめに 1P 本文枠の幅） */
const CANVA_INTRO_PAGE1_BODY_WIDTH_CM = 15.55;

/** Canva `hon_an`（案内人 2P 本文枠の幅） */
const CANVA_INTRO_PAGE2_BODY_WIDTH_CM = 15.29;

const PAGE_PADDING_HORIZONTAL_PT = 40;

/** タイトル 22pt bold（ナンバー「とは」と同じ） */
export const PDF_INTRO_TITLE_FONT_SIZE = 22;

export function introductionBleedContentMarginTopPt(): number {
  return Math.round(CANVA_INTRO_TITLE_Y_CM * CM_TO_PT - PAGE_CONTENT_TOP_OFFSET_PT);
}

export function introductionBleedBodyMarginTopPt(): number {
  const titleTop = CANVA_INTRO_TITLE_Y_CM * CM_TO_PT;
  const bodyTop = CANVA_INTRO_BODY_Y_CM * CM_TO_PT;
  const titleBlock = PDF_INTRO_TITLE_FONT_SIZE * 1.35;
  return Math.max(20, Math.round(bodyTop - titleTop - titleBlock) - 6);
}

export function introductionBleedContentPaddingLeftPt(): number {
  return Math.max(0, Math.round(CANVA_INTRO_BODY_X_CM * CM_TO_PT - PAGE_PADDING_HORIZONTAL_PT));
}

/** タイトル枠の左端（参考・将来の左揃えタイトル用） */
export function introductionBleedTitlePaddingLeftPt(): number {
  return Math.max(0, Math.round(CANVA_INTRO_TITLE_X_CM * CM_TO_PT - PAGE_PADDING_HORIZONTAL_PT));
}

/** Canva 本文テキスト枠の幅（pt） */
export function introductionBleedBodyWidthPt(pageKey: IntroductionPageKey): number {
  const cm = pageKey === "page2" ? CANVA_INTRO_PAGE2_BODY_WIDTH_CM : CANVA_INTRO_PAGE1_BODY_WIDTH_CM;
  return Math.round(cm * CM_TO_PT);
}
