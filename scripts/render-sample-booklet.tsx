import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import React from "react";

import { Document, renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";

import { ReportPdfPages } from "@/components/pdf/ReportPdfPages";
import {
  PDF_CHAPTER_INSERT_BEFORE_3_PATH,
  PDF_CHAPTER_INSERT_BEFORE_4_PATH,
  PDF_FINAL_BACK_COVER_INSERT_PATH,
} from "@/components/pdf/pdfAssetPaths";
import { setPdfPageNumberOffset } from "@/components/pdf/pdfPageNumberOffset";
import { ensureJapaneseFont } from "@/components/pdf/registerFonts";
import { mergeReportPdfWithChapterInserts } from "@/lib/pdf/mergeReportPdfWithInserts";
import { getSampleBookletOrder } from "@/lib/pdf/sampleBookletOrder";

async function main() {
  // @react-pdf/renderer の一部経路で `React` シンボルを参照されるため、
  // TS/Next の自動ランタイムとズレる実行環境を吸収する。
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).React = React;

  const order = getSampleBookletOrder();

  ensureJapaneseFont();

  const countPages = async (bytes: Uint8Array | Buffer): Promise<number> => {
    const doc = await PDFDocument.load(bytes);
    return doc.getPageCount();
  };
  const countPdfPagesFromPath = async (pdfPath: string): Promise<number> => {
    const doc = await PDFDocument.load(fs.readFileSync(pdfPath));
    return doc.getPageCount();
  };
  const baseProps = { order, renderConfig: { focusPage: "all" as const } };

  const insertBeforeChapter3Pages = await countPdfPagesFromPath(PDF_CHAPTER_INSERT_BEFORE_3_PATH);
  const insertBeforeChapter4Pages = await countPdfPagesFromPath(PDF_CHAPTER_INSERT_BEFORE_4_PATH);

  setPdfPageNumberOffset(0);
  const partBeforeChapter3 = await renderToBuffer(
    <Document>
      <ReportPdfPages {...baseProps} segment="beforeChapter3Insert" />
    </Document>,
  );
  const partBeforeChapter3PageCount = await countPages(partBeforeChapter3);

  const chapter3SegmentOffset = partBeforeChapter3PageCount + insertBeforeChapter3Pages;
  setPdfPageNumberOffset(chapter3SegmentOffset);
  const partChapter3ThroughJournalLead = await renderToBuffer(
    <Document>
      <ReportPdfPages {...baseProps} segment="chapter3ThroughJournalInviteLead" />
    </Document>,
  );
  const partChapter3ThroughJournalLeadPageCount = await countPages(partChapter3ThroughJournalLead);

  const chapter4SegmentOffset =
    chapter3SegmentOffset + partChapter3ThroughJournalLeadPageCount + insertBeforeChapter4Pages;
  setPdfPageNumberOffset(chapter4SegmentOffset);
  const partFromChapter4Onward = await renderToBuffer(
    <Document>
      <ReportPdfPages {...baseProps} segment="fromChapter4DividerOnward" />
    </Document>,
  );
  setPdfPageNumberOffset(0);

  const buffer = await mergeReportPdfWithChapterInserts(
    new Uint8Array(partBeforeChapter3),
    PDF_CHAPTER_INSERT_BEFORE_3_PATH,
    new Uint8Array(partChapter3ThroughJournalLead),
    PDF_CHAPTER_INSERT_BEFORE_4_PATH,
    new Uint8Array(partFromChapter4Onward),
    PDF_FINAL_BACK_COVER_INSERT_PATH,
  );

  const outPath = path.join(process.cwd(), "sample-booklet.pdf");
  fs.writeFileSync(outPath, Buffer.from(buffer));
  const bytes = fs.statSync(outPath).size;
  // eslint-disable-next-line no-console
  console.log(outPath);
  // eslint-disable-next-line no-console
  console.error(
    [
      `[sample-booklet] 書き出し完了（${(bytes / (1024 * 1024)).toFixed(1)} MB）。`,
      "PDF を『テキスト』として開くと真っ白に見えることがあります（PDF 用拡張のプレビューならエディターで表示できます）。",
      "ブラウザで見る: npm run dev のあと http://127.0.0.1:3000/preview/sample-booklet",
      "エディターでサクッと: npm run pdf:sample（生成後に Cursor / VS Code でこの PDF を開き直す）",
      "外部アプリ: Mac なら open \"" + outPath + "\" ／ OPEN_SAMPLE_PDF=1 でプレビュー自動起動",
    ].join("\n"),
  );

  if (process.env.OPEN_SAMPLE_PDF === "1" && process.platform === "darwin") {
    spawnSync("open", [outPath], { stdio: "ignore" });
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

