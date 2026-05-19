import { Document, renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";

import { CoverPage } from "@/components/pdf/pages/CoverPage";
import { setPdfRenderQuality } from "@/components/pdf/pdfRenderQualityState";
import type { PdfRenderQuality } from "@/components/pdf/pdfRenderConfig";
import { ensureJapaneseFont } from "@/components/pdf/registerFonts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseQuality(v: string | null): PdfRenderQuality {
  return v === "high" ? "high" : "low";
}

/** 例: /api/dev/cover-preview?quality=low */
export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available outside development." }, { status: 404 });
  }

  const quality = parseQuality(new URL(req.url).searchParams.get("quality"));
  setPdfRenderQuality(quality);
  ensureJapaneseFont();
  const buffer = await renderToBuffer(
    <Document>
      <CoverPage />
    </Document>,
  );

  return new NextResponse(Buffer.from(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Content-Disposition": `inline; filename="cover-${quality}.pdf"`,
    },
  });
}
