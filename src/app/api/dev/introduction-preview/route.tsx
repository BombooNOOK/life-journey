import { Document, renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";

import { IntroductionBleedPage } from "@/components/pdf/pages/IntroductionBleedPage";
import { setPdfRenderQuality } from "@/components/pdf/pdfRenderQualityState";
import type { PdfRenderQuality } from "@/components/pdf/pdfRenderConfig";
import { ensureJapaneseFont } from "@/components/pdf/registerFonts";
import type { IntroductionPageKey } from "@/lib/numerology/pdfIntroductionCopy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parsePageKey(v: string | null): IntroductionPageKey {
  return v === "page2" ? "page2" : "page1";
}

function parseQuality(v: string | null): PdfRenderQuality {
  return v === "high" ? "high" : "low";
}

/**
 * はじめに 1 ページだけ確認（全面 PNG 版とは別）。
 * 例: /api/dev/introduction-preview?page=page1&quality=low
 */
export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available outside development." }, { status: 404 });
  }

  const url = new URL(req.url);
  const pageKey = parsePageKey(url.searchParams.get("page"));
  const quality = parseQuality(url.searchParams.get("quality"));

  setPdfRenderQuality(quality);
  ensureJapaneseFont();
  const buffer = await renderToBuffer(
    <Document>
      <IntroductionBleedPage pageKey={pageKey} />
    </Document>,
  );

  return new NextResponse(Buffer.from(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Content-Disposition": `inline; filename="introduction-${pageKey}-${quality}.pdf"`,
    },
  });
}
