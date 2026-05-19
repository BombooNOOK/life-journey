/** A5 縦（29.7cm）を react-pdf のページ高さ（pt）に合わせる */
const A5_HEIGHT_CM = 29.7;
const A5_HEIGHT_PT = 595.28;
const CM_TO_PT = A5_HEIGHT_PT / A5_HEIGHT_CM;

/** `PdfPageFrame` の `pageBleedForeground` paddingTop + `pageBody` marginTop */
const PAGE_CONTENT_TOP_OFFSET_PT = 46;

const PAGE_PADDING_HORIZONTAL_PT = 40;

/** Canva `chapter_no` */
const CANVA_CHAPTER_NO_Y_CM = 3.76;
const CANVA_CHAPTER_NO_X_CM = 2.1;
const CANVA_CHAPTER_NO_WIDTH_CM = 16.8;
const CANVA_CHAPTER_NO_HEIGHT_CM = 2.22;

/** Canva `chapter_title` */
const CANVA_CHAPTER_TITLE_Y_CM = 14.85;
const CANVA_CHAPTER_TITLE_X_CM = 2.1;
const CANVA_CHAPTER_TITLE_WIDTH_CM = 16.8;

/** Canva 53 / 35 → PDF（他ページと同様にやや縮小） */
export const PDF_CHAPTER_NO_FONT_SIZE = 33;
export const PDF_CHAPTER_TITLE_FONT_SIZE = 22;

/** Canva テキスト色（グレー系） */
export const PDF_CHAPTER_DIVIDER_TEXT_COLOR = "#545454";

function canvaYToTopPt(yCm: number): number {
  return Math.max(0, Math.round(yCm * CM_TO_PT - PAGE_CONTENT_TOP_OFFSET_PT));
}

function canvaXToLeftPt(xCm: number): number {
  return Math.max(0, Math.round(xCm * CM_TO_PT - PAGE_PADDING_HORIZONTAL_PT));
}

function cmToPt(cm: number): number {
  return Math.round(cm * CM_TO_PT);
}

function absoluteBox(yCm: number, xCm: number, widthCm: number, heightCm?: number) {
  const box: {
    position: "absolute";
    top: number;
    left: number;
    width: number;
    maxWidth: number;
    height?: number;
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
  }
  return box;
}

/** フロー改ページを防ぐ最小高さ */
export function chapterDividerContentMinHeightPt(): number {
  return (
    canvaYToTopPt(CANVA_CHAPTER_TITLE_Y_CM) +
    Math.round(PDF_CHAPTER_TITLE_FONT_SIZE * 1.5) +
    8
  );
}

export function chapterNoBoxStyle() {
  return absoluteBox(
    CANVA_CHAPTER_NO_Y_CM,
    CANVA_CHAPTER_NO_X_CM,
    CANVA_CHAPTER_NO_WIDTH_CM,
    CANVA_CHAPTER_NO_HEIGHT_CM,
  );
}

/** タイトル（Canva 枠高 1.47cm は参考。maxHeight 固定だと 22pt が切れる） */
export function chapterTitleBoxStyle() {
  return absoluteBox(
    CANVA_CHAPTER_TITLE_Y_CM,
    CANVA_CHAPTER_TITLE_X_CM,
    CANVA_CHAPTER_TITLE_WIDTH_CM,
  );
}
