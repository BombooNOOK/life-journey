import type { PDFDocumentProxy } from "pdfjs-dist";

let pdfJsModulePromise: Promise<typeof import("pdfjs-dist")> | null = null;

export async function loadKanteiPdfJs(): Promise<typeof import("pdfjs-dist")> {
  if (!pdfJsModulePromise) {
    pdfJsModulePromise = import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
      return pdfjs;
    });
  }
  return pdfJsModulePromise;
}

export async function openKanteiPdfDocument(data: ArrayBuffer): Promise<PDFDocumentProxy> {
  const pdfjs = await loadKanteiPdfJs();
  const task = pdfjs.getDocument({ data: data.slice(0) });
  return task.promise;
}

export async function resolveKanteiPdfNamedDestination(
  pdfDoc: PDFDocumentProxy,
  destinationId: string,
): Promise<number | null> {
  try {
    const dest = await pdfDoc.getDestination(destinationId);
    if (!dest) return null;
    return await pdfDoc.getPageIndex(dest[0]);
  } catch {
    return null;
  }
}
