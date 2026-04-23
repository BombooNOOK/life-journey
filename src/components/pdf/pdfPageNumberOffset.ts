let pdfPageNumberOffset = 0;

export function setPdfPageNumberOffset(offset: number): void {
  pdfPageNumberOffset = Number.isFinite(offset) ? Math.max(0, Math.floor(offset)) : 0;
}

export function getPdfPageNumberOffset(): number {
  return pdfPageNumberOffset;
}

