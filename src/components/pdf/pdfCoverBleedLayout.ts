/** A5 縦（29.7cm）を react-pdf のページ高さ（pt）に合わせる */
const A5_HEIGHT_CM = 29.7;
const A5_HEIGHT_PT = 595.28;
const CM_TO_PT = A5_HEIGHT_PT / A5_HEIGHT_CM;

/** Canva `cover01` */
const CANVA_COVER_TITLE_Y_CM = 8.01;
const CANVA_COVER_TITLE_X_CM = 2.1;
const CANVA_COVER_TITLE_WIDTH_CM = 16.8;
const CANVA_COVER_TITLE_HEIGHT_CM = 4.21;

/**
 * Canva `cover02`（スクショ未共有のため、タイトル枠直下 + 0.15cm ギャップで暫定）
 * 座標が分かり次第ここを差し替え。
 */
const CANVA_COVER_SUBTITLE_Y_CM =
  CANVA_COVER_TITLE_Y_CM + CANVA_COVER_TITLE_HEIGHT_CM + 0.15;
const CANVA_COVER_SUBTITLE_X_CM = CANVA_COVER_TITLE_X_CM;
const CANVA_COVER_SUBTITLE_WIDTH_CM = CANVA_COVER_TITLE_WIDTH_CM;
const CANVA_COVER_SUBTITLE_HEIGHT_CM = 1.35;

/** Canva より PDF でやや小さめ（Libre Baskerville の見え方に合わせて調整） */
export const PDF_COVER_TITLE_FONT_SIZE = 38;
export const PDF_COVER_SUBTITLE_FONT_SIZE = 13.5;

/** Canva テキスト色「ダークブラウン」 */
export const PDF_COVER_TEXT_COLOR = "#574129";

function canvaYToTopPt(yCm: number): number {
  return Math.max(0, Math.round(yCm * CM_TO_PT));
}

function canvaXToLeftPt(xCm: number): number {
  return Math.max(0, Math.round(xCm * CM_TO_PT));
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
    maxHeight?: number;
    justifyContent?: "center";
  } = {
    position: "absolute",
    top: canvaYToTopPt(yCm),
    left: canvaXToLeftPt(xCm),
    width: cmToPt(widthCm),
    maxWidth: cmToPt(widthCm),
    justifyContent: "center",
  };
  if (heightCm != null) {
    const h = cmToPt(heightCm);
    box.height = h;
    box.maxHeight = h;
  }
  return box;
}

export function coverTitleBoxStyle() {
  return absoluteBox(
    CANVA_COVER_TITLE_Y_CM,
    CANVA_COVER_TITLE_X_CM,
    CANVA_COVER_TITLE_WIDTH_CM,
    CANVA_COVER_TITLE_HEIGHT_CM,
  );
}

export function coverSubtitleBoxStyle() {
  return absoluteBox(
    CANVA_COVER_SUBTITLE_Y_CM,
    CANVA_COVER_SUBTITLE_X_CM,
    CANVA_COVER_SUBTITLE_WIDTH_CM,
    CANVA_COVER_SUBTITLE_HEIGHT_CM,
  );
}
