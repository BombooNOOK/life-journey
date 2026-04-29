import { Document, renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function renderSampleBookletWithChapterInserts() {
  const order = getSampleBookletOrder();
  const baseProps = { order, renderConfig: { focusPage: "all" as const } };
  const countPages = async (bytes: Uint8Array | Buffer): Promise<number> => {
    const doc = await PDFDocument.load(bytes);
    return doc.getPageCount();
  };
  const countPdfPagesFromPath = async (pdfPath: string): Promise<number> => {
    const doc = await PDFDocument.load(await readFile(pdfPath));
    return doc.getPageCount();
  };

  try {
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
    return mergeReportPdfWithChapterInserts(
      new Uint8Array(partBeforeChapter3),
      PDF_CHAPTER_INSERT_BEFORE_3_PATH,
      new Uint8Array(partChapter3ThroughJournalLead),
      PDF_CHAPTER_INSERT_BEFORE_4_PATH,
      new Uint8Array(partFromChapter4Onward),
      PDF_FINAL_BACK_COVER_INSERT_PATH,
    );
  } finally {
    setPdfPageNumberOffset(0);
  }
}

/**
 * 開発専用: サンプル冊子 PDF をその場でレンダリングして返す。
 * 初回は 1〜2 分かかることがあります。
 */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available outside development." }, { status: 404 });
  }

  ensureJapaneseFont();
  const buffer = await renderSampleBookletWithChapterInserts();

  return new NextResponse(Buffer.from(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="sample-booklet.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
