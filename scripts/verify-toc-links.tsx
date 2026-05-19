/**
 * 軽量版のみ目次リンク・高画質版はリンクなしを確認
 * Usage: npx tsx scripts/verify-toc-links.tsx
 */
import React from "react";
import { Document, renderToBuffer } from "@react-pdf/renderer";
import { PDFArray, PDFDocument, PDFName } from "pdf-lib";

import { ReportPdfPages } from "@/components/pdf/ReportPdfPages";
import {
  PDF_CHAPTER_INSERT_BEFORE_3_PATH,
  PDF_CHAPTER_INSERT_BEFORE_4_PATH,
} from "@/components/pdf/pdfAssetPaths";
import { ensureJapaneseFont } from "@/components/pdf/registerFonts";
import { mergeReportPdfWithChapterInserts } from "@/lib/pdf/mergeReportPdfWithInserts";
import { PDF_TOC_ENTRIES } from "@/lib/pdf/pdfTocEntries";
import { buildMergedNamedDestinationMap } from "@/lib/pdf/repairMergedPdfInternalLinks";
import { getSampleBookletOrder } from "@/lib/pdf/sampleBookletOrder";
import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";

async function countGoToLinks(bytes: Uint8Array): Promise<number> {
  const pdf = await PDFDocument.load(bytes);
  let count = 0;
  for (const page of pdf.getPages()) {
    const annots = page.node.Annots();
    if (!annots) continue;
    const size = annots.size();
    for (let i = 0; i < size; i++) {
      const ref = annots.get(i);
      const dict = pdf.context.lookup(ref);
      if (dict && "get" in dict) {
        const subtype = (dict as { get: (k: unknown) => unknown }).get(pdf.context.obj("Subtype"));
        const subtypeName =
          subtype && typeof subtype === "object" && "toString" in subtype
            ? String(subtype)
            : String(subtype ?? "");
        if (subtypeName.includes("Link")) count += 1;
      }
    }
  }
  return count;
}

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).React = React;
  ensureJapaneseFont();

  const order = getSampleBookletOrder();
  const expectedTocLinks = PDF_TOC_ENTRIES.length;
  const renderConfig = { quality: "low" as const, focusPage: "all" as const };

  const lowBytes = await renderToBuffer(
    <Document>
      <ReportPdfPages order={order} segment="full" renderConfig={{ quality: "low", focusPage: "all" }} />
    </Document>,
  );
  const highBytes = await renderToBuffer(
    <Document>
      <ReportPdfPages order={order} segment="full" renderConfig={{ quality: "high", focusPage: "all" }} />
    </Document>,
  );

  const lowLinks = await countGoToLinks(lowBytes);
  const highLinks = await countGoToLinks(highBytes);
  const lowKb = Math.round(lowBytes.length / 1024);
  const highKb = Math.round(highBytes.length / 1024);

  let failed = false;
  const fail = (msg: string) => {
    console.log(`FAIL: ${msg}`);
    failed = true;
  };

  if (lowLinks < expectedTocLinks) {
    fail(`low PDF link annotations ${lowLinks} < expected ${expectedTocLinks}`);
  } else {
    console.log(`OK: low PDF has ${lowLinks} link annotations (toc entries=${expectedTocLinks})`);
  }

  if (highLinks !== 0) {
    fail(`high PDF should have 0 link annotations, got ${highLinks}`);
  } else {
    console.log("OK: high PDF has no link annotations");
  }

  console.log(`INFO: sample booklet low≈${lowKb} KiB high≈${highKb} KiB (full segment, no chapter inserts)`);

  const partBeforeChapter3 = new Uint8Array(
    await renderToBuffer(
      <Document>
        <ReportPdfPages order={order} segment="beforeChapter3Insert" renderConfig={renderConfig} />
      </Document>,
    ),
  );
  const partChapter3 = new Uint8Array(
    await renderToBuffer(
      <Document>
        <ReportPdfPages
          order={order}
          segment="chapter3ThroughJournalInviteLead"
          renderConfig={renderConfig}
        />
      </Document>,
    ),
  );
  const partFromChapter4 = new Uint8Array(
    await renderToBuffer(
      <Document>
        <ReportPdfPages order={order} segment="fromChapter4DividerOnward" renderConfig={renderConfig} />
      </Document>,
    ),
  );

  let insertBefore3Pages = 0;
  try {
    const insertBytes = new Uint8Array(await readFile(PDF_CHAPTER_INSERT_BEFORE_3_PATH));
    if (insertBytes.length > 0) {
      insertBefore3Pages = (await PDFDocument.load(insertBytes)).getPageCount();
    }
  } catch {
    insertBefore3Pages = 0;
  }

  const beforePages = (await PDFDocument.load(partBeforeChapter3)).getPageCount();
  const chapter3Pages = (await PDFDocument.load(partChapter3)).getPageCount();
  const mergedDestMap = await buildMergedNamedDestinationMap([
    { pdfBytes: partBeforeChapter3, pageOffset: 0 },
    { pdfBytes: partChapter3, pageOffset: beforePages + insertBefore3Pages },
    { pdfBytes: partFromChapter4, pageOffset: beforePages + insertBefore3Pages + chapter3Pages },
  ]);

  const mergedBytes = await mergeReportPdfWithChapterInserts(
    partBeforeChapter3,
    PDF_CHAPTER_INSERT_BEFORE_3_PATH,
    partChapter3,
    PDF_CHAPTER_INSERT_BEFORE_4_PATH,
    partFromChapter4,
  );
  const mergedPdf = await PDFDocument.load(mergedBytes);
  const tocPage = mergedPdf.getPages()[2];
  const annots = tocPage.node.Annots();
  let explicitDestCount = 0;
  if (annots) {
    for (let i = 0; i < annots.size(); i++) {
      const annot = mergedPdf.context.lookup(annots.get(i));
      const aRef = annot.get(PDFName.of("A"));
      if (!aRef) continue;
      const a = mergedPdf.context.lookup(aRef);
      const d = a.get(PDFName.of("D"));
      const resolved = d ? mergedPdf.context.lookup(d) : null;
      if (resolved instanceof PDFArray) explicitDestCount += 1;
    }
  }
  if (explicitDestCount < expectedTocLinks) {
    fail(`merged repaired explicit dest links ${explicitDestCount} < ${expectedTocLinks}`);
  } else {
    console.log(`OK: merged PDF has ${explicitDestCount} explicit page dest links`);
  }

  for (const entry of PDF_TOC_ENTRIES) {
    if (entry.kind !== "item") continue;
    const pageIndex = mergedDestMap.get(entry.destinationId);
    if (pageIndex == null) {
      fail(`missing named destination ${entry.destinationId} (${entry.label})`);
      continue;
    }
    if (pageIndex !== entry.page) {
      fail(
        `${entry.label}: link lands on reader page ${pageIndex}, toc shows ${entry.page} (dest=${entry.destinationId})`,
      );
    }
  }
  if (!failed) {
    console.log("OK: toc item links match displayed page numbers (merged booklet layout)");
  }

  if (failed) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
