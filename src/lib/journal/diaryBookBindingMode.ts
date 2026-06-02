/**
 * 製本直送（表紙自動コース）の本文ページ数ルール。
 *
 * - PDF 1P: 表紙（本文数に含めない）
 * - PDF 2–3P: 表2・表3（白抜き・本文数に含めない）
 * - PDF 最終P: 裏表紙（本文数に含めない）
 * - 上記以外が「本文」として製本サービスに数えられる
 */
export type DiaryBookBindingMode = "perfect_binding" | "saddle_stitch";

/** 無線綴じ: 本文ページ数は 2 の倍数 */
export const DIARY_BOOK_BINDING_MODE_PERFECT: DiaryBookBindingMode = "perfect_binding";

/** 中綴じ: 本文ページ数は 4 の倍数 */
export const DIARY_BOOK_BINDING_MODE_SADDLE: DiaryBookBindingMode = "saddle_stitch";

export function diaryBookBindingPageMultiple(mode: DiaryBookBindingMode): number {
  return mode === DIARY_BOOK_BINDING_MODE_SADDLE ? 4 : 2;
}

/** 配列上の 1 ページが PDF の何ページ目か（1-based） */
export function diaryBookPdfPageNumber(pageIndex: number): number {
  return pageIndex + 1;
}

/**
 * 製本サービスが数える本文ページ数（表紙・表2/3・裏表紙を除く）。
 * `pages` は裏表紙を含む完成形を想定。
 */
export function countDiaryBookBindingBodyPages(totalPdfPageCount: number): number {
  const excluded = 1 + 2 + 1;
  return Math.max(0, totalPdfPageCount - excluded);
}

/** 本文末尾に足す調整用イラストページ枚数（自動白紙挿入を避ける） */
export function bindingAdjustmentIllustrationPagesNeeded(
  bindingBodyPageCount: number,
  mode: DiaryBookBindingMode,
): number {
  const multiple = diaryBookBindingPageMultiple(mode);
  if (bindingBodyPageCount <= 0) return 0;
  const remainder = bindingBodyPageCount % multiple;
  return remainder === 0 ? 0 : multiple - remainder;
}
