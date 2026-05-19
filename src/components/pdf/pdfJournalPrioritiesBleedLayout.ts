/** A5 縦（29.7cm）を react-pdf のページ高さ（pt）に合わせる */
const A5_HEIGHT_CM = 29.7;
const A5_HEIGHT_PT = 595.28;
const CM_TO_PT = A5_HEIGHT_PT / A5_HEIGHT_CM;

/** `pageBleedForeground` paddingTop + `pageBody` marginTop */
const PAGE_CONTENT_TOP_OFFSET_PT = 46;

const PAGE_PADDING_HORIZONTAL_PT = 40;

/** Canva `toshi_title` */
const CANVA_TITLE_Y_CM = 1.9;
const CANVA_TITLE_X_CM = 2.03;
const CANVA_TITLE_WIDTH_CM = 17.14;

/** Canva `toshi_messe`（枠 14.43×1.42 cm・2行） */
const CANVA_MESSAGE_Y_CM = 4.17;
const CANVA_MESSAGE_X_CM = 3.38;
const CANVA_MESSAGE_WIDTH_CM = 14.43;
const CANVA_MESSAGE_BOX_HEIGHT_CM = 1.42;

/** Canva ラベル（参照高さ 0.65 cm・1行想定。PDF では固定高＋overflow だと文字が消えるため高さは付けない） */
const CANVA_LABEL_X_CM = 2.25;
const CANVA_THEME_LABEL_Y_CM = 6.71;
const CANVA_THEME_LABEL_WIDTH_CM = 5.71;
const CANVA_AWARENESS_LABEL_Y_CM = 13.98;
const CANVA_AWARENESS_LABEL_WIDTH_CM = 4.85;
const CANVA_SELF_WORD_LABEL_Y_CM = 21.3;
const CANVA_SELF_WORD_LABEL_X_CM = 2.34;
const CANVA_SELF_WORD_LABEL_WIDTH_CM = 6.03;

/** 最下ラベル下端（コンテナ高さ用） */
const CANVA_CONTENT_BOTTOM_CM = 21.95;

export const PDF_JOURNAL_PRIORITIES_TEXT_COLOR = "#545454";
/** タイトル（`toshi_title`）— 現状どおり */
export const PDF_JOURNAL_PRIORITIES_TITLE_FONT_SIZE = 20;
/** `toshi_messe` — Canva 16 より PDF では大きく見えるため 2 行枠に合わせて縮小 */
export const PDF_JOURNAL_PRIORITIES_MESSAGE_FONT_SIZE = 11;
export const PDF_JOURNAL_PRIORITIES_MESSAGE_LINE_HEIGHT = 1.28;
/** `toshi_thema` 等 — 1 行枠（0.65 cm）に収める */
export const PDF_JOURNAL_PRIORITIES_LABEL_FONT_SIZE = 10.5;
export const PDF_JOURNAL_PRIORITIES_LABEL_LINE_HEIGHT = 1.12;

function canvaYToTopPt(yCm: number): number {
  return Math.max(0, Math.round(yCm * CM_TO_PT - PAGE_CONTENT_TOP_OFFSET_PT));
}

function canvaXToLeftPt(xCm: number): number {
  return Math.max(0, Math.round(xCm * CM_TO_PT - PAGE_PADDING_HORIZONTAL_PT));
}

function cmToPt(cm: number): number {
  return Math.round(cm * CM_TO_PT);
}

function absoluteBox(
  yCm: number,
  xCm: number,
  widthCm: number,
  heightCm?: number,
) {
  const box: {
    position: "absolute";
    top: number;
    left: number;
    width: number;
    maxWidth: number;
    height?: number;
    maxHeight?: number;
    overflow?: "hidden";
  } = {
    position: "absolute",
    top: canvaYToTopPt(yCm),
    left: canvaXToLeftPt(xCm),
    width: cmToPt(widthCm),
    maxWidth: cmToPt(widthCm),
  };
  if (heightCm != null) {
    const h = cmToPt(heightCm);
    box.height = h;
    box.maxHeight = h;
    box.overflow = "hidden";
  }
  return box;
}

/** 記入枠ラベルまでの相対高さ（フロー改ページを防ぐ） */
export function journalPrioritiesContentMinHeightPt(): number {
  return canvaYToTopPt(CANVA_CONTENT_BOTTOM_CM) + PDF_JOURNAL_PRIORITIES_LABEL_FONT_SIZE + 4;
}

export function journalPrioritiesTitleBoxStyle() {
  return absoluteBox(CANVA_TITLE_Y_CM, CANVA_TITLE_X_CM, CANVA_TITLE_WIDTH_CM);
}

export function journalPrioritiesMessageBoxStyle() {
  return absoluteBox(
    CANVA_MESSAGE_Y_CM,
    CANVA_MESSAGE_X_CM,
    CANVA_MESSAGE_WIDTH_CM,
    CANVA_MESSAGE_BOX_HEIGHT_CM,
  );
}

export function journalPrioritiesThemeLabelBoxStyle() {
  return absoluteBox(CANVA_THEME_LABEL_Y_CM, CANVA_LABEL_X_CM, CANVA_THEME_LABEL_WIDTH_CM);
}

export function journalPrioritiesAwarenessLabelBoxStyle() {
  return absoluteBox(
    CANVA_AWARENESS_LABEL_Y_CM,
    CANVA_LABEL_X_CM,
    CANVA_AWARENESS_LABEL_WIDTH_CM,
  );
}

export function journalPrioritiesSelfWordLabelBoxStyle() {
  return absoluteBox(
    CANVA_SELF_WORD_LABEL_Y_CM,
    CANVA_SELF_WORD_LABEL_X_CM,
    CANVA_SELF_WORD_LABEL_WIDTH_CM,
  );
}
