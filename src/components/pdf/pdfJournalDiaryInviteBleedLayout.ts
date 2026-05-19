/** A5 縦（29.7cm）を react-pdf のページ高さ（pt）に合わせる */
const A5_HEIGHT_CM = 29.7;
const A5_HEIGHT_PT = 595.28;
const CM_TO_PT = A5_HEIGHT_PT / A5_HEIGHT_CM;

/** `pageBleedForeground` paddingTop + `pageBody` marginTop */
const PAGE_CONTENT_TOP_OFFSET_PT = 46;

const PAGE_PADDING_HORIZONTAL_PT = 40;

/** Canva `shime_honbun` */
const CANVA_HONBUN_Y_CM = 3.78;
const CANVA_HONBUN_X_CM = 2.73;
const CANVA_HONBUN_WIDTH_CM = 15.55;
const CANVA_HONBUN_BOX_HEIGHT_CM = 9.93;

/** Canva `shime_cm1`（角丸枠内・下段） */
const CANVA_CM1_Y_CM = 20.8;
const CANVA_CM1_X_CM = 3.04;
const CANVA_CM1_WIDTH_CM = 15.55;
const CANVA_CM1_BOX_HEIGHT_CM = 4.39;

/** Canva `shime_cm2` */
const CANVA_CM2_Y_CM = 26.62;
const CANVA_CM2_X_CM = 4.11;
const CANVA_CM2_WIDTH_CM = 9.21;

/** Canva `shime_qr` */
const CANVA_QR_Y_CM = 25.73;
const CANVA_QR_X_CM = 13.71;
const CANVA_QR_SIZE_CM = 2.46;

const CANVA_CONTENT_BOTTOM_CM = CANVA_QR_Y_CM + CANVA_QR_SIZE_CM;

export const PDF_JOURNAL_DIARY_INVITE_TEXT_COLOR = "#545454";
export const PDF_JOURNAL_DIARY_INVITE_BODY_FONT_SIZE = 11;
export const PDF_JOURNAL_DIARY_INVITE_BODY_LINE_HEIGHT = 1.45;
export const PDF_JOURNAL_DIARY_INVITE_URL_FONT_SIZE = 11;
export const PDF_JOURNAL_DIARY_INVITE_SIGNATURE_FONT_SIZE = 11;

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

export function journalDiaryInviteContentMinHeightPt(): number {
  return canvaYToTopPt(CANVA_CONTENT_BOTTOM_CM) + 8;
}

export function journalDiaryInviteHonbunBoxStyle() {
  return absoluteBox(
    CANVA_HONBUN_Y_CM,
    CANVA_HONBUN_X_CM,
    CANVA_HONBUN_WIDTH_CM,
    CANVA_HONBUN_BOX_HEIGHT_CM,
  );
}

/** Canva `shime_honbun` 枠内右下（署名） */
export function journalDiaryInviteSignatureBoxStyle() {
  const yCm = CANVA_HONBUN_Y_CM + CANVA_HONBUN_BOX_HEIGHT_CM - 0.65;
  return absoluteBox(yCm, CANVA_HONBUN_X_CM, CANVA_HONBUN_WIDTH_CM);
}

export function journalDiaryInviteCm1BoxStyle() {
  return absoluteBox(CANVA_CM1_Y_CM, CANVA_CM1_X_CM, CANVA_CM1_WIDTH_CM);
}

export function journalDiaryInviteCm2BoxStyle() {
  return absoluteBox(CANVA_CM2_Y_CM, CANVA_CM2_X_CM, CANVA_CM2_WIDTH_CM);
}

export function journalDiaryInviteQrBoxStyle() {
  const size = cmToPt(CANVA_QR_SIZE_CM);
  return {
    position: "absolute" as const,
    top: canvaYToTopPt(CANVA_QR_Y_CM),
    left: canvaXToLeftPt(CANVA_QR_X_CM),
    width: size,
    height: size,
  };
}
