/**
 * Usage: npx tsx scripts/inspect-toc-pdf-links.ts
 */
import { writeFileSync } from "node:fs";

import React from "react";
import { Document, renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument, PDFName } from "pdf-lib";

import { ReportPdfPages } from "@/components/pdf/ReportPdfPages";
import { ensureJapaneseFont } from "@/components/pdf/registerFonts";
import { mergeReportPdfWithChapterInserts } from "@/lib/pdf/mergeReportPdfWithInserts";
import {
  PDF_CHAPTER_INSERT_BEFORE_3_PATH,
  PDF_CHAPTER_INSERT_BEFORE_4_PATH,
} from "@/components/pdf/pdfAssetPaths";
import { getSampleBookletOrder } from "@/lib/pdf/sampleBookletOrder";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).React = React;

function dumpDict(pdf: PDFDocument, ref: unknown, depth = 0): void {
  const indent = "  ".repeat(depth);
  const dict = pdf.context.lookup(ref);
  if (!dict || typeof dict !== "object" || !("entries" in dict)) {
    console.log(`${indent}(not dict)`);
    return;
  }
  for (const [key, value] of (dict as { entries: () => Iterable<[unknown, unknown]> }).entries()) {
    const keyStr = key instanceof PDFName ? key.toString() : String(key);
    if (keyStr === "/Parent" || keyStr === "/P") continue;
    if (keyStr === "/A" || keyStr === "/Dest" || keyStr === "/D") {
      console.log(`${indent}${keyStr}:`);
      dumpDict(pdf, value, depth + 1);
    } else if (keyStr === "/S" || keyStr === "/Type" || keyStr === "/URI") {
      const v = pdf.context.lookup(value);
      console.log(`${indent}${keyStr}: ${v}`);
    }
  }
}

async function inspect(label: string, bytes: Uint8Array) {
  const pdf = await PDFDocument.load(bytes);
  const raw = Buffer.from(bytes).toString("latin1");
  console.log(`\n=== ${label} ===`);
  console.log(`pages: ${pdf.getPageCount()}`);
  console.log(`raw contains toc-life-path: ${raw.includes("toc-life-path")}`);

  const tocPage = pdf.getPages()[2];
  const annots = tocPage.node.Annots();
  if (!annots || annots.size() === 0) {
    console.log("no annots on page 3");
    return;
  }
  console.log(`toc page link annots: ${annots.size()}`);
  const ref = annots.get(0);
  const dict = pdf.context.lookup(ref);
  console.log("first link annot:");
  dumpDict(pdf, ref, 1);

  const namesRef = pdf.catalog.get(PDFName.of("Names"));
  console.log(`catalog /Names present: ${Boolean(namesRef)}`);
  if (namesRef) {
    const names = pdf.context.lookup(namesRef);
    if (names && typeof names === "object" && "get" in names) {
      const dests = (names as { get: (k: unknown) => unknown }).get(PDFName.of("Dests"));
      console.log(`  /Dests present: ${Boolean(dests)}`);
    }
  }
}

async function main() {
  ensureJapaneseFont();
  const order = getSampleBookletOrder();
  const renderConfig = { quality: "low" as const, focusPage: "all" as const };

  const single = await renderToBuffer(
    <Document>
      <ReportPdfPages order={order} segment="full" renderConfig={renderConfig} />
    </Document>,
  );
  writeFileSync("/tmp/toc-single.pdf", single);
  await inspect("single segment (no merge)", single);

  const part1 = await renderToBuffer(
    <Document>
      <ReportPdfPages order={order} segment="beforeChapter3Insert" renderConfig={renderConfig} />
    </Document>,
  );
  const part3 = await renderToBuffer(
    <Document>
      <ReportPdfPages order={order} segment="chapter3ThroughJournalInviteLead" renderConfig={renderConfig} />
    </Document>,
  );
  const part4 = await renderToBuffer(
    <Document>
      <ReportPdfPages order={order} segment="fromChapter4DividerOnward" renderConfig={renderConfig} />
    </Document>,
  );
  const merged = await mergeReportPdfWithChapterInserts(
    new Uint8Array(part1),
    PDF_CHAPTER_INSERT_BEFORE_3_PATH,
    new Uint8Array(part3),
    PDF_CHAPTER_INSERT_BEFORE_4_PATH,
    new Uint8Array(part4),
  );
  writeFileSync("/tmp/toc-merged.pdf", merged);
  await inspect("merged via mergeReportPdfWithChapterInserts (should repair links)", merged);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
