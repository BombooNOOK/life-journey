import { Document, renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";

import { JournalMemoBleedPage } from "@/components/pdf/pages/JournalMemoBleedPage";
import type { JournalMemoPageKey } from "@/lib/numerology/pdfJournalMemoCopy";
import { setPdfRenderQuality } from "@/components/pdf/pdfRenderQualityState";
import type { PdfRenderQuality } from "@/components/pdf/pdfRenderConfig";
import { ensureJapaneseFont } from "@/components/pdf/registerFonts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseQuality(v: string | null): PdfRenderQuality {
  return v === "high" ? "high" : "low";
}

function parsePage(v: string | null): JournalMemoPageKey {
  return v === "right" ? "right" : "left";
}

/** 例: /api/dev/journal-memo-preview?page=left|right&quality=low */
export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available outside development." }, { status: 404 });
  }

  const url = new URL(req.url);
  const page = parsePage(url.searchParams.get("page"));
  const quality = parseQuality(url.searchParams.get("quality"));

  setPdfRenderQuality(quality);
  ensureJapaneseFont();
  const buffer = await renderToBuffer(
    <Document>
      <JournalMemoBleedPage page={page} />
    </Document>,
  );

  return new NextResponse(Buffer.from(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Content-Disposition": `inline; filename="journal-memo-${page}-${quality}.pdf"`,
    },
  });
}
