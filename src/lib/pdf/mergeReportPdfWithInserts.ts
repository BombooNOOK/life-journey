import { readFile } from "node:fs/promises";

import { PDFDocument } from "pdf-lib";

const INSERT_PAGE_MAX_WIDTH_RATIO = 0.9;
const INSERT_PAGE_MAX_HEIGHT_RATIO = 0.9;
const INSERT_PAGE_MARGIN = 24;

function lastPageSize(doc: PDFDocument): { width: number; height: number } {
  const pages = doc.getPages();
  const last = pages[pages.length - 1];
  return last.getSize();
}

async function appendInsertPdfScaledOntoWhitePage(
  merged: PDFDocument,
  pdfPath: string,
): Promise<void> {
  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await readFile(pdfPath));
  } catch (err) {
    // 例: Vercel の実行環境に挿入PDFが同梱されていない場合
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("ENOENT")) return;
    throw err;
  }
  if (bytes.length === 0) return;

  const embeddedPages = await merged.embedPdf(bytes);
  if (embeddedPages.length === 0) return;

  const { width: pw, height: ph } = lastPageSize(merged);

  for (const embedded of embeddedPages) {
    const page = merged.addPage([pw, ph]);
    const maxW = pw * INSERT_PAGE_MAX_WIDTH_RATIO;
    const maxH = ph * INSERT_PAGE_MAX_HEIGHT_RATIO;
    const scale = Math.min(maxW / embedded.width, maxH / embedded.height, 1);
    const w = embedded.width * scale;
    const h = embedded.height * scale;
    const x = (pw - w) / 2;
    const y = Math.max(INSERT_PAGE_MARGIN, (ph - h) / 2);
    page.drawPage(embedded, { x, y, width: w, height: h });
  }
}

export async function mergeReportPdfWithChapterInserts(
  partBeforeChapter3: Uint8Array,
  insertBeforeChapter3PdfPath: string,
  partChapter3ThroughJournalLead: Uint8Array,
  insertBeforeChapter4PdfPath: string,
  partFromChapter4Onward: Uint8Array,
  finalBackCoverInsertPdfPath?: string,
): Promise<Uint8Array> {
  const merged = await PDFDocument.create();

  async function appendPdfBytes(bytes: Uint8Array): Promise<void> {
    const doc = await PDFDocument.load(bytes);
    const indices = doc.getPageIndices();
    const copied = await merged.copyPages(doc, indices);
    for (const p of copied) {
      merged.addPage(p);
    }
  }

  await appendPdfBytes(partBeforeChapter3);
  await appendInsertPdfScaledOntoWhitePage(merged, insertBeforeChapter3PdfPath);
  await appendPdfBytes(partChapter3ThroughJournalLead);
  await appendInsertPdfScaledOntoWhitePage(merged, insertBeforeChapter4PdfPath);
  await appendPdfBytes(partFromChapter4Onward);
  if (finalBackCoverInsertPdfPath) {
    try {
      await appendInsertPdfScaledOntoWhitePage(merged, finalBackCoverInsertPdfPath);
    } catch (err) {
      console.error(
        "[mergeReportPdfWithChapterInserts] 裏表紙の挿入をスキップしました（ファイルが無いか破損しています）:",
        err,
      );
    }
  }

  return merged.save();
}
