/** A5 縦（29.7cm）を react-pdf のページ高さ（pt）に合わせる */
const A5_HEIGHT_CM = 29.7;
const A5_HEIGHT_PT = 595.28;
const CM_TO_PT = A5_HEIGHT_PT / A5_HEIGHT_CM;

/** `pageBleedForeground` paddingTop + `pageBody` marginTop */
const PAGE_CONTENT_TOP_OFFSET_PT = 46;

const PAGE_PADDING_HORIZONTAL_PT = 40;

/** Canva `yohaku`（余白 4P・5P 共通） */
const CANVA_YOHAKU_TITLE_Y_CM = 0.69;
/** Canva 枠 5.46cm だが 20pt だと「余白の｜ページ」に折れるため 1 行用に拡幅（中心 X≈10.5cm は維持） */
const CANVA_YOHAKU_TITLE_X_CM = 6.6;
const CANVA_YOHAKU_TITLE_WIDTH_CM = 7.8;
const CANVA_YOHAKU_TITLE_BOX_HEIGHT_CM = 0.91;

/** Canva `yohaku_fukuro`（右P・吹き出し 6.88×1.57 cm） */
const CANVA_YOHAKU_FUKURO_Y_CM = 21.44;
const CANVA_YOHAKU_FUKURO_X_CM = 12.03;
const CANVA_YOHAKU_FUKURO_WIDTH_CM = 6.88;
const CANVA_YOHAKU_FUKURO_BOX_HEIGHT_CM = 1.57;

export const PDF_JOURNAL_MEMO_TEXT_COLOR = "#545454";
/** Canva 21.6 → PDF ではやや大きく見えるため 20pt（他章タイトルと揃える） */
export const PDF_JOURNAL_MEMO_TITLE_FONT_SIZE = 20;
/** Canva 16 → 2行枠（1.57 cm）に収める */
export const PDF_JOURNAL_MEMO_FUKURO_FONT_SIZE = 10.5;
export const PDF_JOURNAL_MEMO_FUKURO_LINE_HEIGHT = 1.28;

/** 本文・吹き出し（方眼エリア） */
function canvaYToTopPt(yCm: number): number {
  return Math.max(0, Math.round(yCm * CM_TO_PT - PAGE_CONTENT_TOP_OFFSET_PT));
}

/**
 * ページ上端からの Canva Y（`yohaku` は 0.69cm と上端に近い）。
 * `max(0)` だと方眼側に押し下げられるため、白い上余白へは負の top も許可する。
 */
function canvaYToTopPtForPageHeader(yCm: number): number {
  return Math.round(yCm * CM_TO_PT - PAGE_CONTENT_TOP_OFFSET_PT);
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

export function journalMemoContentMinHeightPt(includeFukuroComment: boolean): number {
  const bottomCm = includeFukuroComment
    ? Math.max(
        CANVA_YOHAKU_TITLE_Y_CM + CANVA_YOHAKU_TITLE_BOX_HEIGHT_CM,
        CANVA_YOHAKU_FUKURO_Y_CM + CANVA_YOHAKU_FUKURO_BOX_HEIGHT_CM,
      )
    : CANVA_YOHAKU_TITLE_Y_CM + CANVA_YOHAKU_TITLE_BOX_HEIGHT_CM;
  return canvaYToTopPt(bottomCm) + PDF_JOURNAL_MEMO_TITLE_FONT_SIZE + 4;
}

/** Canva `yohaku`（1行・ページ上端の白い帯） */
export function journalMemoTitleBoxStyle() {
  const box = absoluteBox(
    CANVA_YOHAKU_TITLE_Y_CM,
    CANVA_YOHAKU_TITLE_X_CM,
    CANVA_YOHAKU_TITLE_WIDTH_CM,
  );
  return {
    ...box,
    top: canvaYToTopPtForPageHeader(CANVA_YOHAKU_TITLE_Y_CM),
  };
}

/** Canva `yohaku_fukuro`（右Pのみ） */
export function journalMemoFukuroCommentBoxStyle() {
  return absoluteBox(
    CANVA_YOHAKU_FUKURO_Y_CM,
    CANVA_YOHAKU_FUKURO_X_CM,
    CANVA_YOHAKU_FUKURO_WIDTH_CM,
    CANVA_YOHAKU_FUKURO_BOX_HEIGHT_CM,
  );
}
