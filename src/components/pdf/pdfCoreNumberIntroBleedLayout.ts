/** A5 縦（29.7cm）を react-pdf のページ高さ（pt）に合わせる */
const A5_HEIGHT_CM = 29.7;
const A5_HEIGHT_PT = 595.28;
const CM_TO_PT = A5_HEIGHT_PT / A5_HEIGHT_CM;

/** `PdfPageFrame` の `pageBleedForeground` paddingTop + `pageBody` marginTop */
const PAGE_CONTENT_TOP_OFFSET_PT = 46;

const PAGE_PADDING_HORIZONTAL_PT = 40;

/** Canva `core` テキスト枠 */
const CANVA_CORE_LABEL_Y_CM = 11.86;
/** ナンバー別見出し（空白エリア中央付近・Canva `core` 下のキャッチ） */
const CANVA_CORE_SUBTITLE_Y_CM = 20.13;
const CANVA_CORE_SUBTITLE_HEIGHT_CM = 0.93;
/** バースデー「テーマ」行（サブタイトル直下） */
const CANVA_CORE_THEME_Y_CM = 21.35;
const CANVA_CORE_THEME_HEIGHT_CM = 0.8;
const CANVA_CORE_LABEL_X_CM = 2.1;
const CANVA_CORE_LABEL_WIDTH_CM = 16.8;

/** Canva 26 → PDF（他ページと同様にやや縮小） */
const CANVA_CORE_LABEL_FONT_PT = 26;
export const PDF_CORE_NUMBER_INTRO_LABEL_FONT_SIZE = 17;
/** Canva 22 → PDF（ラベルと同じ縮尺） */
const CANVA_CORE_SUBTITLE_FONT_PT = 22;
export const PDF_CORE_NUMBER_INTRO_SUBTITLE_FONT_SIZE = Math.round(
  (CANVA_CORE_SUBTITLE_FONT_PT * PDF_CORE_NUMBER_INTRO_LABEL_FONT_SIZE) / CANVA_CORE_LABEL_FONT_PT,
);
/** バースデーテーマ行（やや小さめ・中央） */
export const PDF_CORE_NUMBER_INTRO_THEME_FONT_SIZE = 10;

/** 章扉・コアテキストと同系のグレー */
export const PDF_CORE_NUMBER_INTRO_TEXT_COLOR = "#545454";

function canvaYToTopPt(yCm: number): number {
  return Math.max(0, Math.round(yCm * CM_TO_PT - PAGE_CONTENT_TOP_OFFSET_PT));
}

function canvaXToLeftPt(xCm: number): number {
  return Math.max(0, Math.round(xCm * CM_TO_PT - PAGE_PADDING_HORIZONTAL_PT));
}

function cmToPt(cm: number): number {
  return Math.round(cm * CM_TO_PT);
}

export function coreNumberIntroLabelBoxStyle() {
  const width = cmToPt(CANVA_CORE_LABEL_WIDTH_CM);
  return {
    position: "absolute" as const,
    top: canvaYToTopPt(CANVA_CORE_LABEL_Y_CM),
    left: canvaXToLeftPt(CANVA_CORE_LABEL_X_CM),
    width,
    maxWidth: width,
    minHeight: Math.round(PDF_CORE_NUMBER_INTRO_LABEL_FONT_SIZE * 1.35),
  };
}

export function coreNumberIntroThemeBoxStyle() {
  const width = cmToPt(CANVA_CORE_LABEL_WIDTH_CM);
  return {
    position: "absolute" as const,
    top: canvaYToTopPt(CANVA_CORE_THEME_Y_CM),
    left: canvaXToLeftPt(CANVA_CORE_LABEL_X_CM),
    width,
    maxWidth: width,
    minHeight: cmToPt(CANVA_CORE_THEME_HEIGHT_CM),
  };
}

export function coreNumberIntroSubtitleBoxStyle() {
  const width = cmToPt(CANVA_CORE_LABEL_WIDTH_CM);
  return {
    position: "absolute" as const,
    top: canvaYToTopPt(CANVA_CORE_SUBTITLE_Y_CM),
    left: canvaXToLeftPt(CANVA_CORE_LABEL_X_CM),
    width,
    maxWidth: width,
    minHeight: cmToPt(CANVA_CORE_SUBTITLE_HEIGHT_CM),
  };
}

export function coreNumberIntroContentMinHeightPt(hasThemeLine = false): number {
  const bottomCm = hasThemeLine
    ? CANVA_CORE_THEME_Y_CM + CANVA_CORE_THEME_HEIGHT_CM
    : CANVA_CORE_SUBTITLE_Y_CM + CANVA_CORE_SUBTITLE_HEIGHT_CM;
  return canvaYToTopPt(bottomCm) + 8;
}
