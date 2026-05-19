import { Document, renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";

import { ChapterDividerBleedPage } from "@/components/pdf/pages/ChapterDividerBleedPage";
import { setPdfRenderQuality } from "@/components/pdf/pdfRenderQualityState";
import type { PdfRenderQuality } from "@/components/pdf/pdfRenderConfig";
import { ensureJapaneseFont } from "@/components/pdf/registerFonts";
import type { ChapterDividerKey } from "@/lib/numerology/pdfChapterDividerCopy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseChapter(v: string | null): ChapterDividerKey {
  const n = Number(v);
  if (n === 2 || n === 3 || n === 4) return n;
  return 1;
}

function parseQuality(v: string | null): PdfRenderQuality {
  return v === "high" ? "high" : "low";
}

/** 例: /api/dev/chapter-divider-preview?chapter=1&quality=low */
export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available outside development." }, { status: 404 });
  }

  const url = new URL(req.url);
  const chapter = parseChapter(url.searchParams.get("chapter"));
  const quality = parseQuality(url.searchParams.get("quality"));

  setPdfRenderQuality(quality);
  ensureJapaneseFont();
  const buffer = await renderToBuffer(
    <Document>
      <ChapterDividerBleedPage chapter={chapter} />
    </Document>,
  );

  return new NextResponse(Buffer.from(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Content-Disposition": `inline; filename="chapter-divider-${chapter}-${quality}.pdf"`,
    },
  });
}
