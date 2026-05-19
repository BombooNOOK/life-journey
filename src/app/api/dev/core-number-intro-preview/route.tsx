import { Document, renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";

import { CoreNumberIntroBleedPage } from "@/components/pdf/pages/CoreNumberIntroBleedPage";
import { setPdfRenderQuality } from "@/components/pdf/pdfRenderQualityState";
import type { PdfRenderQuality } from "@/components/pdf/pdfRenderConfig";
import { ensureJapaneseFont } from "@/components/pdf/registerFonts";
import {
  getCoreNumberIntroSubtitle,
  getCoreNumberIntroThemeLine,
} from "@/lib/numerology/pdfCoreIntroSubtitle";
import type { CoreNumberIntroKey } from "@/lib/numerology/pdfCoreNumberIntroCopy";
import { getSampleBookletOrder } from "@/lib/pdf/sampleBookletOrder";
import { maturityNumberFromNumerology } from "@/lib/numerology/reduce";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORE_KEYS = new Set<CoreNumberIntroKey>([
  "lifePath",
  "destiny",
  "soul",
  "personality",
  "birthday",
  "maturity",
]);

function parseCoreKey(v: string | null): CoreNumberIntroKey {
  if (v && CORE_KEYS.has(v as CoreNumberIntroKey)) return v as CoreNumberIntroKey;
  return "lifePath";
}

function parseQuality(v: string | null): PdfRenderQuality {
  return v === "high" ? "high" : "low";
}

/** 例: /api/dev/core-number-intro-preview?core=lifePath&quality=low */
export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available outside development." }, { status: 404 });
  }

  const url = new URL(req.url);
  const coreKey = parseCoreKey(url.searchParams.get("core"));
  const quality = parseQuality(url.searchParams.get("quality"));

  setPdfRenderQuality(quality);
  ensureJapaneseFont();
  const order = getSampleBookletOrder();
  const maturity = maturityNumberFromNumerology(order.numerology);
  const buffer = await renderToBuffer(
    <Document>
      <CoreNumberIntroBleedPage
        coreKey={coreKey}
        subtitle={getCoreNumberIntroSubtitle(coreKey, order, maturity)}
        themeLine={getCoreNumberIntroThemeLine(coreKey, order)}
      />
    </Document>,
  );

  return new NextResponse(Buffer.from(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Content-Disposition": `inline; filename="core-intro-${coreKey}-${quality}.pdf"`,
    },
  });
}
