import type { PdfRenderQuality } from "./pdfRenderConfig";

let currentPdfRenderQuality: PdfRenderQuality = "high";

export function setPdfRenderQuality(quality: PdfRenderQuality): void {
  currentPdfRenderQuality = quality;
}

export function getPdfRenderQuality(): PdfRenderQuality {
  return currentPdfRenderQuality;
}
