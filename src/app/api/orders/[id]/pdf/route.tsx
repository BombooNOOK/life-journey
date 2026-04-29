import { Document, renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";

import { ReportDocument } from "@/components/pdf/ReportDocument";
import { ReportPdfPages } from "@/components/pdf/ReportPdfPages";
import {
  PDF_CHAPTER_INSERT_BEFORE_3_PATH,
  PDF_CHAPTER_INSERT_BEFORE_4_PATH,
  PDF_FINAL_BACK_COVER_INSERT_PATH,
} from "@/components/pdf/pdfAssetPaths";
import type { BodyTuneStep, FocusPage, PdfRenderConfig } from "@/components/pdf/pdfRenderConfig";
import { setPdfPageNumberOffset } from "@/components/pdf/pdfPageNumberOffset";
import { ensureJapaneseFont } from "@/components/pdf/registerFonts";
import { getViewerEmailFromCookie, normalizeEmail } from "@/lib/auth/viewer";
import { mergeReportPdfWithChapterInserts } from "@/lib/pdf/mergeReportPdfWithInserts";
import { prisma } from "@/lib/db";
import type { OrderPayload } from "@/lib/order/types";
import { orderPayloadFromOrderRow } from "@/lib/order/serialize";

async function renderFullReportWithChapterPdfInserts(
  order: OrderPayload,
  renderConfig: PdfRenderConfig | undefined,
): Promise<Uint8Array> {
  const baseProps = { order, renderConfig };
  const countPages = async (bytes: Uint8Array | Buffer): Promise<number> => {
    const doc = await PDFDocument.load(bytes);
    return doc.getPageCount();
  };
  const countPdfPagesFromPath = async (pdfPath: string): Promise<number> => {
    const bytes = await readFile(pdfPath);
    const doc = await PDFDocument.load(bytes);
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

interface RouteParams {
  params: Promise<{ id: string }>;
}

function parseFocusPage(v: string | null): FocusPage {
  if (v === "lifePath" || v === "bridge" || v === "personalYear") return v;
  return "all";
}

function parseBodyTune(v: string | null): BodyTuneStep {
  if (v === "step1" || v === "step2" || v === "step3") return v;
  return "normal";
}

export async function GET(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const row = await prisma.order.findUnique({ where: { id } });
  if (!row) {
    return NextResponse.json({ error: "注文が見つかりません" }, { status: 404 });
  }
  if (normalizeEmail(row.email) !== viewerEmail) {
    return NextResponse.json({ error: "この注文にはアクセスできません" }, { status: 403 });
  }

  const url = new URL(req.url);
  const focusPage = parseFocusPage(url.searchParams.get("focus"));
  const bodyTune = parseBodyTune(url.searchParams.get("bodyTune"));
  const downloadParam = url.searchParams.get("download");
  const shouldDownload = downloadParam !== "0";

  const renderConfig =
    bodyTune === "normal" && focusPage === "all"
      ? undefined
      : {
          focusPage,
          bodyFontFamily: "NotoSansJP" as const,
          // 依頼順: fontSize -> lineHeight -> width
          bodyFontSize: bodyTune === "step1" || bodyTune === "step2" || bodyTune === "step3" ? 9.2 : undefined,
          bodyLineHeight: bodyTune === "step2" || bodyTune === "step3" ? 1.55 : undefined,
          bodyExpandWidth: bodyTune === "step3" ? 4 : undefined,
        };

  let buffer: Buffer | Uint8Array;
  try {
    ensureJapaneseFont();
    const payload = orderPayloadFromOrderRow(row);

    buffer =
      focusPage === "all"
        ? await renderFullReportWithChapterPdfInserts(payload, renderConfig)
        : await renderToBuffer(<ReportDocument order={payload} renderConfig={renderConfig} />);
  } catch (e) {
    const message = e instanceof Error ? e.message : "PDF生成に失敗しました。";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const u8: Uint8Array = Buffer.isBuffer(buffer) ? Uint8Array.from(buffer) : buffer;
  const copy = new Uint8Array(u8.byteLength);
  copy.set(u8);
  const body = new Blob([copy], { type: "application/pdf" });

  const filename =
    bodyTune === "normal" && focusPage === "all"
      ? `kantei-${id.slice(0, 8)}.pdf`
      : `kantei-${id.slice(0, 8)}-${focusPage}-${bodyTune}.pdf`;
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${shouldDownload ? "attachment" : "inline"}; filename="${filename}"`,
    },
  });
}
