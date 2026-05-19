/** A5 縦（29.7cm）を react-pdf のページ高さ（pt）に合わせる */
const A5_HEIGHT_CM = 29.7;
const A5_HEIGHT_PT = 595.28;
const CM_TO_PT = A5_HEIGHT_PT / A5_HEIGHT_CM;

/** `pageBleedForeground` paddingTop + `pageBody` marginTop */
const PAGE_CONTENT_TOP_OFFSET_PT = 46;

const PAGE_PADDING_HORIZONTAL_PT = 40;

/** Canva `huri_title` */
const CANVA_TITLE_Y_CM = 1.9;
const CANVA_TITLE_X_CM = 2.03;
const CANVA_TITLE_WIDTH_CM = 17.14;

/** Canva `huri_messe`（2行・枠 16.8×1.42 cm） */
const CANVA_MESSAGE_Y_CM = 4.06;
const CANVA_MESSAGE_X_CM = 2.37;
const CANVA_MESSAGE_WIDTH_CM = 16.8;
const CANVA_MESSAGE_BOX_HEIGHT_CM = 1.42;

/** Canva `huri01` */
const CANVA_HURI01_Y_CM = 6.65;
const CANVA_HURI01_X_CM = 2.1;
const CANVA_HURI01_WIDTH_CM = 9.5;

/** Canva `huri02` */
const CANVA_HURI02_Y_CM = 12.13;
const CANVA_HURI02_X_CM = 2.2;
const CANVA_HURI02_WIDTH_CM = 13.04;

/** Canva `huri03` */
const CANVA_HURI03_Y_CM = 17.5;
const CANVA_HURI03_X_CM = 2.37;
const CANVA_HURI03_WIDTH_CM = 4.85;

/** Canva `huri04` */
const CANVA_HURI04_Y_CM = 22.98;
const CANVA_HURI04_X_CM = 2.2;
const CANVA_HURI04_WIDTH_CM = 6.88;

const CANVA_LABEL_BOX_HEIGHT_CM = 0.65;
const CANVA_CONTENT_BOTTOM_CM = CANVA_HURI04_Y_CM + CANVA_LABEL_BOX_HEIGHT_CM;

export const PDF_JOURNAL_RETROSPECT_TEXT_COLOR = "#545454";
export const PDF_JOURNAL_RETROSPECT_TITLE_FONT_SIZE = 20;
export const PDF_JOURNAL_RETROSPECT_MESSAGE_FONT_SIZE = 11;
export const PDF_JOURNAL_RETROSPECT_MESSAGE_LINE_HEIGHT = 1.28;
export const PDF_JOURNAL_RETROSPECT_LABEL_FONT_SIZE = 10.5;
export const PDF_JOURNAL_RETROSPECT_LABEL_LINE_HEIGHT = 1.12;

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

export function journalRetrospectContentMinHeightPt(): number {
  return canvaYToTopPt(CANVA_CONTENT_BOTTOM_CM) + PDF_JOURNAL_RETROSPECT_LABEL_FONT_SIZE + 4;
}

export function journalRetrospectTitleBoxStyle() {
  return absoluteBox(CANVA_TITLE_Y_CM, CANVA_TITLE_X_CM, CANVA_TITLE_WIDTH_CM);
}

export function journalRetrospectMessageBoxStyle() {
  return absoluteBox(
    CANVA_MESSAGE_Y_CM,
    CANVA_MESSAGE_X_CM,
    CANVA_MESSAGE_WIDTH_CM,
    CANVA_MESSAGE_BOX_HEIGHT_CM,
  );
}

/** Canva `huri01` */
export function journalRetrospectThemeLabelBoxStyle() {
  return absoluteBox(CANVA_HURI01_Y_CM, CANVA_HURI01_X_CM, CANVA_HURI01_WIDTH_CM);
}

/** Canva `huri02` */
export function journalRetrospectAwarenessLabelBoxStyle() {
  return absoluteBox(CANVA_HURI02_Y_CM, CANVA_HURI02_X_CM, CANVA_HURI02_WIDTH_CM);
}

/** Canva `huri03` */
export function journalRetrospectImpressionLabelBoxStyle() {
  return absoluteBox(CANVA_HURI03_Y_CM, CANVA_HURI03_X_CM, CANVA_HURI03_WIDTH_CM);
}

/** Canva `huri04` */
export function journalRetrospectCarryForwardLabelBoxStyle() {
  return absoluteBox(CANVA_HURI04_Y_CM, CANVA_HURI04_X_CM, CANVA_HURI04_WIDTH_CM);
}
