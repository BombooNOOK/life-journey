import { readFile } from "node:fs/promises";

import { PDFDocument } from "pdf-lib";

import {
  buildMergedNamedDestinationMap,
  repairMergedPdfInternalLinks,
} from "@/lib/pdf/repairMergedPdfInternalLinks";

async function appendPdfBytes(merged: PDFDocument, bytes: Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(bytes);
  const indices = doc.getPageIndices();
  const copied = await merged.copyPages(doc, indices);
  for (const p of copied) {
    merged.addPage(p);
  }
  return copied.length;
}

async function appendInsertPdfFromPath(merged: PDFDocument, pdfPath: string): Promise<number> {
  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await readFile(pdfPath));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("ENOENT")) return 0;
    throw err;
  }
  if (bytes.length === 0) return 0;
  return appendPdfBytes(merged, bytes);
}

export async function mergeReportPdfWithChapterInserts(
  partBeforeChapter3: Uint8Array,
  insertBeforeChapter3PdfPath: string,
  partChapter3ThroughJournalLead: Uint8Array,
  _insertBeforeChapter4PdfPath: string,
  partFromChapter4Onward: Uint8Array,
  finalBackCoverInsertPdfPath?: string,
): Promise<Uint8Array> {
  const merged = await PDFDocument.create();
  const destinationSegments: { pdfBytes: Uint8Array; pageOffset: number }[] = [];
  let pageOffset = 0;

  const trackSegment = async (bytes: Uint8Array) => {
    destinationSegments.push({ pdfBytes: bytes, pageOffset });
    const added = await appendPdfBytes(merged, bytes);
    pageOffset += added;
  };

  await trackSegment(partBeforeChapter3);
  pageOffset += await appendInsertPdfFromPath(merged, insertBeforeChapter3PdfPath);
  await trackSegment(partChapter3ThroughJournalLead);
  /** 旧 blank02（PY章後フクロウ全面）は React の章末装飾＋章後メッセージに移行済み。結合しない。 */
  await trackSegment(partFromChapter4Onward);
  if (finalBackCoverInsertPdfPath) {
    try {
      pageOffset += await appendInsertPdfFromPath(merged, finalBackCoverInsertPdfPath);
    } catch (err) {
      console.error(
        "[mergeReportPdfWithChapterInserts] 裏表紙の挿入をスキップしました（ファイルが無いか破損しています）:",
        err,
      );
    }
  }

  const mergedBytes = await merged.save();
  const destinationMap = await buildMergedNamedDestinationMap(destinationSegments);
  if (destinationMap.size === 0) return mergedBytes;

  return repairMergedPdfInternalLinks(mergedBytes, destinationMap);
}
