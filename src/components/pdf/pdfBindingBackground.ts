import {
  PDF_BACK_COVER_PATH,
  PDF_SPREAD_LEFT_PATH,
  PDF_SPREAD_RIGHT_PATH,
} from "./pdfAssetPaths";

/**
 * 無線綴じ・左綴じ想定の「見開き背景」用画像を、PDF の絶対ページ番号から選ぶ。
 *
 * - 1P: 表紙（`CoverPage` 側で別画像。ここでは扱わない）
 * - 2P: 本文開始前の独立ページとして扱う（背景なし）
 * - 3P以降: 奇数ページ＝見開き左、偶数ページ＝見開き右
 * - 最終ページ: 裏表紙用画像（1Pのみのときは発生しない）
 */
export function bindingBackgroundImageSrc(
  pageNumber: number,
  totalPages: number,
): string | null {
  if (pageNumber <= 1) return null;
  if (totalPages > 1 && pageNumber === totalPages) {
    return PDF_BACK_COVER_PATH;
  }
  if (pageNumber <= 2) {
    return null;
  }
  if (pageNumber % 2 === 1) {
    return PDF_SPREAD_LEFT_PATH;
  }
  return PDF_SPREAD_RIGHT_PATH;
}
