/** @react-pdf A5 portrait（148×210mm） */
export const DIARY_BOOK_PDF_PAGE_WIDTH_PT = (148 / 25.4) * 72;
export const DIARY_BOOK_PDF_PAGE_HEIGHT_PT = (210 / 25.4) * 72;

export const DIARY_BOOK_DESIGN_WIDTH_PX = 724;
export const DIARY_BOOK_DESIGN_HEIGHT_PX = 1024;

/** 724×1024 テンプレ → A5 への軸別スケール（ほぼ同値） */
export const DIARY_BOOK_PDF_SCALE_X =
  DIARY_BOOK_PDF_PAGE_WIDTH_PT / DIARY_BOOK_DESIGN_WIDTH_PX;
export const DIARY_BOOK_PDF_SCALE_Y =
  DIARY_BOOK_PDF_PAGE_HEIGHT_PT / DIARY_BOOK_DESIGN_HEIGHT_PX;

export function diaryBookPdfPx(pixels: number, axis: "x" | "y"): number {
  const scale = axis === "x" ? DIARY_BOOK_PDF_SCALE_X : DIARY_BOOK_PDF_SCALE_Y;
  return pixels * scale;
}

export function diaryBookPdfPct(pct: string, axis: "x" | "y"): number {
  const n = parseFloat(pct) / 100;
  if (!Number.isFinite(n)) return 0;
  return n * (axis === "x" ? DIARY_BOOK_PDF_PAGE_WIDTH_PT : DIARY_BOOK_PDF_PAGE_HEIGHT_PT);
}

export function parseCssPx(value: string): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 11;
}

/** Page 自体には寸法を付けない（CoverPage / PdfPageFrame と同様） */
export const diaryBookPdfPageStyle = {
  padding: 0,
  margin: 0,
} as const;

/**
 * A5 1枚分のキャンバス（Page の 100% に一致）。
 * 724×1024 テンプレ座標は diaryBookPdfPx / diaryBookPdfPct で A5 に縮小配置する。
 */
export const diaryBookPdfPageCanvasStyle = {
  position: "relative" as const,
  width: "100%",
  height: "100%",
};

/** 背景は切らず全体表示（contain） */
export const diaryBookPdfFullBleedImageStyle = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  objectFit: "contain" as const,
};

export const diaryBookPdfOverlayRootStyle = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
};
