import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";

import { DiaryBookPrintDocument } from "@/components/pdf/diaryBook/DiaryBookPrintDocument";
import { ensureJapaneseFont } from "@/components/pdf/registerFonts";
import { isAdminEmail } from "@/lib/admin/access";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import {
  DiaryBookPrintPdfError,
  diaryBookPrintPdfFilename,
  loadDiaryBookPrintPdfPayload,
} from "@/lib/journal/diaryBookPrintPdfData";

export const runtime = "nodejs";
export const maxDuration = 300;

const PDF_API_CACHE_HEADERS = {
  "Cache-Control": "private, no-store",
} as const;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  try {
    const viewerEmail = await getViewerEmailFromCookie();
    if (!(await isAdminEmail(viewerEmail))) {
      return NextResponse.json(
        { error: "管理者のみアクセスできます。" },
        { status: 401, headers: PDF_API_CACHE_HEADERS },
      );
    }

    const { requestId } = await params;
    const url = new URL(req.url);
    const shouldDownload = url.searchParams.get("download") === "1";

    const payload = await loadDiaryBookPrintPdfPayload(requestId);
    ensureJapaneseFont();
    const buffer = await renderToBuffer(<DiaryBookPrintDocument {...payload} />);
    const filename = diaryBookPrintPdfFilename(payload.bindingCode);
    const body = new Blob([new Uint8Array(buffer)], { type: "application/pdf" });

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${shouldDownload ? "attachment" : "inline"}; filename="${filename}"`,
        ...PDF_API_CACHE_HEADERS,
      },
    });
  } catch (e) {
    if (e instanceof DiaryBookPrintPdfError) {
      console.error("[diary-book-print-pdf]", { code: e.code, message: e.message });
      return NextResponse.json(
        { error: e.message, code: e.code },
        { status: e.status, headers: PDF_API_CACHE_HEADERS },
      );
    }

    const message = e instanceof Error ? e.message : "PDF生成に失敗しました。";
    console.error("[diary-book-print-pdf] 未捕捉エラー", e);
    return NextResponse.json(
      { error: message },
      { status: 500, headers: PDF_API_CACHE_HEADERS },
    );
  }
}
