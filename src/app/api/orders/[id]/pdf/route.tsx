import { Document, renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
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
import { resolveSubscriberPdfAccess } from "@/lib/account/pdfAccess";
import { isAdminEmail } from "@/lib/admin/access";
import { getViewerEmailFromCookie, normalizeEmail } from "@/lib/auth/viewer";
import { mergeReportPdfWithChapterInserts } from "@/lib/pdf/mergeReportPdfWithInserts";
import {
  buildOrderPdfCacheFingerprint,
  fetchCachedOrderPdfFromBlobUrl,
  orderFullPdfRequestCacheable,
  orderPdfBlobWriteEnabled,
  putOrderFullPdfToBlob,
} from "@/lib/pdf/orderPdfBlobCache";
import { getPdfPageCountFromStaticFile } from "@/lib/pdf/staticPdfFilePageCount";
import { prisma } from "@/lib/db";
import { combinePdfDownloadLimit, fetchAccountPdfDownloadLimitOrNull } from "@/lib/order/effectivePdfDownloadLimit";
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

  try {
    const [insertBeforeChapter3Pages, insertBeforeChapter4Pages] = await Promise.all([
      getPdfPageCountFromStaticFile(PDF_CHAPTER_INSERT_BEFORE_3_PATH),
      getPdfPageCountFromStaticFile(PDF_CHAPTER_INSERT_BEFORE_4_PATH),
    ]);

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

function htmlWhenDownloadLimitExceeded(reissueUrl: string, limit: number): string {
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
    <p>この鑑定書は無料閲覧回数（${limit}回）を使い切りました。</p>
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

/** CDN／ブラウザが古い 429 や PDF を返さないようにする（Cookie でユーザーごとに結果が違うため Vary も付与） */
const PDF_API_CACHE_HEADERS = {
  "Cache-Control": "private, no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Vary: "Cookie",
} as const;

/**
 * 鑑定書全体の生成は @react-pdf + pdf-lib で数分かかることがある。
 * Hobby 等では maxDuration がプラン上限を超えるとデプロイ自体が失敗する（invalid maxDuration for plan）。
 * 無料枠は最大 300 秒まで。Pro でより長くしたい場合は 800 まで引き上げ可能。
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request, { params }: RouteParams) {
  let pathForLog = "";
  try {
    pathForLog = new URL(req.url).pathname;
  } catch {
    pathForLog = "(invalid-url)";
  }
  console.log("[pdf-api] GET入口（Handler到達）", { path: pathForLog });

  const { id } = await params;
  console.log("[pdf-api] GET params解決", { orderId: id });

  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    console.log("[pdf-api] 早期終了 401 未ログイン", { orderId: id });
    return NextResponse.json(
      { error: "ログインが必要です" },
      { status: 401, headers: { ...PDF_API_CACHE_HEADERS } },
    );
  }
  const row = await prisma.order.findUnique({ where: { id } });
  if (!row) {
    console.log("[pdf-api] 早期終了 404 注文なし", { orderId: id });
    return NextResponse.json(
      { error: "注文が見つかりません" },
      { status: 404, headers: { ...PDF_API_CACHE_HEADERS } },
    );
  }
  if (normalizeEmail(row.email) !== viewerEmail) {
    console.log("[pdf-api] 早期終了 403 メール不一致", { orderId: id });
    return NextResponse.json(
      { error: "この注文にはアクセスできません" },
      { status: 403, headers: { ...PDF_API_CACHE_HEADERS } },
    );
  }

  const url = new URL(req.url);
  const focusPage = parseFocusPage(url.searchParams.get("focus"));
  const bodyTune = parseBodyTune(url.searchParams.get("bodyTune"));
  const quality = parsePdfQuality(url.searchParams.get("quality"));
  const downloadParam = url.searchParams.get("download");
  const shouldDownload = downloadParam !== "0";

  if (quality === "high") {
    const subscriberPdf = await resolveSubscriberPdfAccess(viewerEmail);
    const admin = await isAdminEmail(viewerEmail);
    if (!subscriberPdf && !admin) {
      console.log("[pdf-api] 早期終了 403 高画質権限なし", { orderId: id });
      return NextResponse.json(
        {
          error:
            "製本用（高画質）PDFはサブスク加入者向けです。プレビュー版（軽量）をご利用ください。",
          code: "SUBSCRIBER_PDF_REQUIRED",
        },
        { status: 403, headers: { ...PDF_API_CACHE_HEADERS } },
      );
    }
  }

  const accountCap = await fetchAccountPdfDownloadLimitOrNull(viewerEmail);
  const downloadLimit = combinePdfDownloadLimit(row.pdfDownloadLimit, accountCap);
  const downloadCount = row.pdfDownloadCount ?? 0;

  if (downloadLimit !== (row.pdfDownloadLimit ?? 2)) {
    await prisma.order
      .update({
        where: { id: row.id },
        data: { pdfDownloadLimit: downloadLimit },
      })
      .catch(() => {});
  }
  const reissueUrl =
    process.env.NEXT_PUBLIC_BASE_PDF_REISSUE_URL ??
    process.env.NEXT_PUBLIC_BASE_BOOK_TRIAL_URL ??
    "https://thebase.com";

  if (shouldDownload && downloadCount >= downloadLimit) {
    console.log("[pdf-api] 早期終了 429 ダウンロード上限", {
      orderId: id,
      downloadCount,
      downloadLimit,
    });
    return new NextResponse(htmlWhenDownloadLimitExceeded(reissueUrl, downloadLimit), {
      status: 429,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        ...PDF_API_CACHE_HEADERS,
      },
    });
  }

  const renderConfig: PdfRenderConfig = { quality };
  if (!(bodyTune === "normal" && focusPage === "all")) {
    renderConfig.focusPage = focusPage;
    renderConfig.bodyFontFamily = "NotoSansJP";
    // 依頼順: fontSize -> lineHeight -> width
    renderConfig.bodyFontSize =
      bodyTune === "step1" || bodyTune === "step2" || bodyTune === "step3" ? 9.2 : undefined;
    renderConfig.bodyLineHeight = bodyTune === "step2" || bodyTune === "step3" ? 1.55 : undefined;
    renderConfig.bodyExpandWidth = bodyTune === "step3" ? 4 : undefined;
  }

  const pdfLogBase = {
    orderId: id,
    focusPage,
    bodyTune,
    quality,
    shouldDownload,
  };

  const cacheableFullPdf = orderFullPdfRequestCacheable(focusPage, bodyTune);
  const blobWrites = orderPdfBlobWriteEnabled();
  const cacheFingerprintPayload = cacheableFullPdf
    ? {
        numerologyJson: row.numerologyJson,
        stonesJson: row.stonesJson,
        stoneFocusTheme: row.stoneFocusTheme,
        birthDate: row.birthDate,
        birthYear: row.birthYear,
        birthMonth: row.birthMonth,
        birthDay: row.birthDay,
        lastName: row.lastName,
        firstName: row.firstName,
        lastNameKana: row.lastNameKana,
        firstNameKana: row.firstNameKana,
        lastNameRoman: row.lastNameRoman,
        firstNameRoman: row.firstNameRoman,
        fullNameDisplay: row.fullNameDisplay,
        fullNameKanaDisplay: row.fullNameKanaDisplay,
        fullNameRomanDisplay: row.fullNameRomanDisplay,
        postalCode: row.postalCode,
        address: row.address,
        phone: row.phone,
        email: row.email,
        profileId: row.profileId,
      }
    : null;
  const pdfCacheKey = cacheFingerprintPayload
    ? buildOrderPdfCacheFingerprint(cacheFingerprintPayload)
    : null;

  let buffer!: Buffer | Uint8Array;
  let servedFromBlob = false;

  if (cacheableFullPdf && blobWrites && pdfCacheKey) {
    const blobUrl = quality === "high" ? row.pdfPrintBlobUrl : row.pdfPreviewBlobUrl;
    const storedKey = quality === "high" ? row.pdfPrintCacheKey : row.pdfPreviewCacheKey;
    if (blobUrl && storedKey === pdfCacheKey) {
      const cached = await fetchCachedOrderPdfFromBlobUrl(blobUrl);
      if (cached && cached.byteLength > 0) {
        buffer = cached;
        servedFromBlob = true;
        console.log("[pdf-api] Blobキャッシュヒット", {
          ...pdfLogBase,
          bytes: cached.byteLength,
        });
      }
    }
  }

  if (!servedFromBlob) {
    try {
      console.log("[pdf-api] PDF生成開始", { ...pdfLogBase, blobCache: cacheableFullPdf && blobWrites });
      ensureJapaneseFont();
      const payload = orderPayloadFromOrderRow(row);

      buffer =
        focusPage === "all"
          ? await renderFullReportWithChapterPdfInserts(payload, renderConfig)
          : await renderToBuffer(<ReportDocument order={payload} renderConfig={renderConfig} />);
      console.log("[pdf-api] PDF生成完了", pdfLogBase);
    } catch (e) {
      const caught =
        e instanceof Error
          ? { name: e.name, message: e.message, stack: e.stack }
          : { raw: String(e) };
      console.error("[pdf-api] catch されたエラー全文", JSON.stringify({ ...pdfLogBase, error: caught }));
      const message = e instanceof Error ? e.message : "PDF生成に失敗しました。";
      return NextResponse.json(
        { error: message },
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...PDF_API_CACHE_HEADERS },
        },
      );
    }
  }

  const u8: Uint8Array = Buffer.isBuffer(buffer) ? Uint8Array.from(buffer) : buffer;
  console.log("[pdf-api] PDFバッファサイズ(bytes)", {
    ...pdfLogBase,
    bytes: u8.byteLength,
    servedFromBlob,
  });

  if (
    !servedFromBlob &&
    cacheableFullPdf &&
    blobWrites &&
    pdfCacheKey &&
    u8.byteLength > 0
  ) {
    try {
      const blobUrl = await putOrderFullPdfToBlob(id, quality, u8);
      await prisma.order.update({
        where: { id: row.id },
        data:
          quality === "high"
            ? { pdfPrintBlobUrl: blobUrl, pdfPrintCacheKey: pdfCacheKey }
            : { pdfPreviewBlobUrl: blobUrl, pdfPreviewCacheKey: pdfCacheKey },
      });
      console.log("[pdf-api] Blob保存完了", { ...pdfLogBase, pathname: `order-full-pdf/${id}/` });
    } catch (e) {
      console.warn("[pdf-api] Blob保存失敗（生成済みPDFは返却します）", e);
    }
  }
  const copy = new Uint8Array(u8.byteLength);
  copy.set(u8);
  const body = new Blob([copy], { type: "application/pdf" });

  const variantSlug = quality === "high" ? "print" : "preview";
  const filename =
    bodyTune === "normal" && focusPage === "all"
      ? `kantei-${id.slice(0, 8)}-${variantSlug}.pdf`
      : `kantei-${id.slice(0, 8)}-${focusPage}-${bodyTune}-${variantSlug}.pdf`;
  const response = new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${shouldDownload ? "attachment" : "inline"}; filename="${filename}"`,
      ...PDF_API_CACHE_HEADERS,
    },
  });
  if (shouldDownload) {
    await prisma.order.update({
      where: { id: row.id },
      data: { pdfDownloadCount: { increment: 1 } },
    });
    console.log("[pdf-api] pdfDownloadCount increment 実行", pdfLogBase);
  }
  console.log("[pdf-api] Response返却直前", {
    ...pdfLogBase,
    bytes: u8.byteLength,
    filename,
    contentDisposition: shouldDownload ? "attachment" : "inline",
  });
  return response;
}
