/**
 * あしあとブック製本 PDF 想定のページ左右（1-based）。
 * `pdfBindingBackground` と同じ: 3P 以降は奇数＝見開き左、偶数＝見開き右。
 */
export function isDiaryBookLeftPage(pageNumber: number): boolean {
  return pageNumber % 2 === 1;
}

export function isDiaryBookRightPage(pageNumber: number): boolean {
  return pageNumber % 2 === 0;
}

/** 次に追加するページ番号（1-based） */
export function nextDiaryBookPageNumber(currentPageCount: number): number {
  return currentPageCount + 1;
}
