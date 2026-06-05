/** @react-pdf A5 portrait (pt) */
export const DIARY_BOOK_PDF_PAGE_WIDTH_PT = 595.28;
export const DIARY_BOOK_PDF_PAGE_HEIGHT_PT = 841.89;

export const DIARY_BOOK_DESIGN_WIDTH_PX = 724;
export const DIARY_BOOK_DESIGN_HEIGHT_PX = 1024;

export function diaryBookPdfPx(pixels: number, axis: "x" | "y"): number {
  const base = axis === "x" ? DIARY_BOOK_DESIGN_WIDTH_PX : DIARY_BOOK_DESIGN_HEIGHT_PX;
  const page = axis === "x" ? DIARY_BOOK_PDF_PAGE_WIDTH_PT : DIARY_BOOK_PDF_PAGE_HEIGHT_PT;
  return (pixels / base) * page;
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
