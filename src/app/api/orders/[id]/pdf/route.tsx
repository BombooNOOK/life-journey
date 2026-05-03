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
import type {
  BodyTuneStep,
  FocusPage,
  PdfRenderConfig,
  PdfRenderQuality,
} from "@/components/pdf/pdfRenderConfig";
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
    let bytes: Buffer;
    try {
      const b = await readFile(pdfPath);
      bytes = b;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("ENOENT")) return 0;
      throw err;
    }
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

function htmlWhenDownloadLimitExceeded(reissueUrl: string): string {
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>PDFダウンロード上限</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif; padding: 24px; color:#1f2937; line-height:1.7; }
    .box { max-width: 680px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; }
    .btn { display:inline-block; margin-top: 12px; background:#92400e; color:#fff; padding:10px 14px; border-radius:8px; text-decoration:none; font-weight:600; }
    .muted { color:#6b7280; font-size: 13px; }
  </style>
</head>
<body>
  <div class="box">
    <h1 style="margin-top:0;">鑑定書PDFのダウンロード上限に達しました</h1>
    <p>この鑑定書は無料閲覧回数（2回）を使い切りました。</p>
    <p>追加の再発行をご希望の場合は、下のリンクからお手続きください。</p>
    <a class="btn" href="${reissueUrl}" target="_blank" rel="noreferrer">再発行（有料）ページへ</a>
    <p class="muted">閲覧・ダウンロードのどちらでも、1回アクセスするごとに回数を1つ消費します。</p>
  </div>
</body>
</html>`;
}

function parseFocusPage(v: string | null): FocusPage {
  if (v === "lifePath" || v === "bridge" || v === "personalYear") return v;
  return "all";
}

function parseBodyTune(v: string | null): BodyTuneStep {
  if (v === "step1" || v === "step2" || v === "step3") return v;
  return "normal";
}

function parsePdfQuality(v: string | null): PdfRenderQuality {
  return v === "high" ? "high" : "low";
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
  const quality = parsePdfQuality(url.searchParams.get("quality"));
  const downloadParam = url.searchParams.get("download");
  const shouldDownload = downloadParam !== "0";
  const downloadLimit = row.pdfDownloadLimit ?? 2;
  const downloadCount = row.pdfDownloadCount ?? 0;
  const reissueUrl =
    process.env.NEXT_PUBLIC_BASE_PDF_REISSUE_URL ??
    process.env.NEXT_PUBLIC_BASE_BOOK_TRIAL_URL ??
    "https://thebase.com";

  if (shouldDownload && downloadCount >= downloadLimit) {
    return new NextResponse(htmlWhenDownloadLimitExceeded(reissueUrl), {
      status: 429,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const renderConfig: PdfRenderConfig = { quality };
  /** 軽量版: 本文をわずかに詰めてページ数・転送量を抑える（画像は別レイヤー） */
  if (quality === "low" && bodyTune === "normal" && focusPage === "all") {
    renderConfig.bodyFontFamily = "NotoSansJP";
    renderConfig.bodyFontSize = 9;
    renderConfig.bodyLineHeight = 1.48;
  }
  if (!(bodyTune === "normal" && focusPage === "all")) {
    renderConfig.focusPage = focusPage;
    renderConfig.bodyFontFamily = "NotoSansJP";
    // 依頼順: fontSize -> lineHeight -> width
    renderConfig.bodyFontSize =
      bodyTune === "step1" || bodyTune === "step2" || bodyTune === "step3" ? 9.2 : undefined;
    renderConfig.bodyLineHeight = bodyTune === "step2" || bodyTune === "step3" ? 1.55 : undefined;
    renderConfig.bodyExpandWidth = bodyTune === "step3" ? 4 : undefined;
  }

  let buffer: Buffer | Uint8Array;
  try {
    ensureJapaneseFont();
    const payload = orderPayloadFromOrderRow(row);

    buffer =
      focusPage === "all" && quality === "high"
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
      ? `kantei-${id.slice(0, 8)}-${quality}.pdf`
      : `kantei-${id.slice(0, 8)}-${focusPage}-${bodyTune}-${quality}.pdf`;
  const response = new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${shouldDownload ? "attachment" : "inline"}; filename="${filename}"`,
    },
  });
  if (shouldDownload) {
    await prisma.order.update({
      where: { id: row.id },
      data: { pdfDownloadCount: { increment: 1 } },
    });
  }
  return response;
}
