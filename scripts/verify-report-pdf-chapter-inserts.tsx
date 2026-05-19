/**
 * 章挿入PDF・フクロウ重複の回帰チェック
 * Usage: npx tsx scripts/verify-report-pdf-chapter-inserts.tsx
 */
import React from "react";
import { Document, renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";

import { ReportPdfPages } from "@/components/pdf/ReportPdfPages";
import { PersonalYearAfterMessageBleedPage } from "@/components/pdf/pages/PersonalYearAfterMessageBleedPage";
import {
  PDF_CHAPTER_INSERT_BEFORE_3_PATH,
  PDF_CHAPTER_INSERT_BEFORE_4_PATH,
} from "@/components/pdf/pdfAssetPaths";
import {
  MERGE_CHAPTER_INSERT_BEFORE_4,
  chapterInsertBefore3PageCount,
  chapterInsertBefore4PageCount,
} from "@/lib/pdf/chapterInsertConfig";
import { mergeReportPdfWithChapterInserts } from "@/lib/pdf/mergeReportPdfWithInserts";
import { ensureJapaneseFont } from "@/components/pdf/registerFonts";
import { getSampleBookletOrder } from "@/lib/pdf/sampleBookletOrder";

async function pageCount(bytes: Uint8Array): Promise<number> {
  return (await PDFDocument.load(bytes)).getPageCount();
}

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).React = React;
  ensureJapaneseFont();

  let failed = false;
  const fail = (msg: string) => {
    console.log(`FAIL: ${msg}`);
    failed = true;
  };

  if (MERGE_CHAPTER_INSERT_BEFORE_4) {
    fail("MERGE_CHAPTER_INSERT_BEFORE_4 must be false (旧PY章後全面画像の重複防止)");
  } else {
    console.log("OK: chapter-insert-before-4 merge disabled");
  }

  const insert3 = await chapterInsertBefore3PageCount();
  const insert4 = await chapterInsertBefore4PageCount();
  if (insert4 !== 0) fail(`insert4 page count should be 0, got ${insert4}`);
  else console.log("OK: insert-before-4 contributes 0 pages");

  const pyAfterPages = await pageCount(
    await renderToBuffer(
      <Document>
        <PersonalYearAfterMessageBleedPage />
      </Document>,
    ),
  );
  if (pyAfterPages !== 1) fail(`PY章後メッセージ should be 1 page, got ${pyAfterPages}`);
  else console.log("OK: PY章後メッセージ 1 page");

  const order = getSampleBookletOrder();
  const ch3 = await renderToBuffer(
    <Document>
      <ReportPdfPages order={order} segment="chapter3ThroughJournalInviteLead" />
    </Document>,
  );
  const ch3Pages = await pageCount(ch3);
  // 扉+PYとは+一覧+9年+装飾(足跡)+章後フクロウ = 14（第3章扉は次セグメント）
  if (ch3Pages !== 14) {
    fail(`chapter3 segment expected 14 pages, got ${ch3Pages}`);
  } else {
    console.log("OK: chapter3 segment 14 pages");
  }

  const part1 = await renderToBuffer(
    <Document>
      <ReportPdfPages order={order} segment="beforeChapter3Insert" />
    </Document>,
  );
  const part3 = await renderToBuffer(
    <Document>
      <ReportPdfPages order={order} segment="fromChapter4DividerOnward" />
    </Document>,
  );
  const merged = await mergeReportPdfWithChapterInserts(
    new Uint8Array(part1),
    PDF_CHAPTER_INSERT_BEFORE_3_PATH,
    new Uint8Array(ch3),
    PDF_CHAPTER_INSERT_BEFORE_4_PATH,
    new Uint8Array(part3),
  );
  const mergedPages = await pageCount(merged);
  const expectedMerged = (await pageCount(part1)) + insert3 + ch3Pages + (await pageCount(part3));
  if (mergedPages !== expectedMerged) {
    fail(`merged pages ${mergedPages} !== expected ${expectedMerged}`);
  } else {
    console.log(`OK: merged booklet pages ${mergedPages} (insert3=${insert3})`);
  }

  if (failed) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
