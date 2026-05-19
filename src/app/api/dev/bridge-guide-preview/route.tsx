import { Document, renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";

import { BridgeGuideBleedPage } from "@/components/pdf/pages/BridgeGuideBleedPage";
import type { BridgeGuidePageKey } from "@/lib/numerology/pdfBridgeGuideCopy";
import { setPdfRenderQuality } from "@/components/pdf/pdfRenderQualityState";
import type { PdfRenderQuality } from "@/components/pdf/pdfRenderConfig";
import { ensureJapaneseFont } from "@/components/pdf/registerFonts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseQuality(v: string | null): PdfRenderQuality {
  return v === "high" ? "high" : "low";
}

function parsePage(v: string | null): BridgeGuidePageKey {
  return v === "page2" ? "page2" : "page1";
}

/** 例: /api/dev/bridge-guide-preview?page=page1|page2&quality=low */
export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available outside development." }, { status: 404 });
  }

  const url = new URL(req.url);
  const quality = parseQuality(url.searchParams.get("quality"));
  const page = parsePage(url.searchParams.get("page"));
  setPdfRenderQuality(quality);
  ensureJapaneseFont();
  const buffer = await renderToBuffer(
    <Document>
      <BridgeGuideBleedPage page={page} />
    </Document>,
  );

  return new NextResponse(Buffer.from(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Content-Disposition": `inline; filename="bridge-guide-${page}-${quality}.pdf"`,
    },
  });
}
