import { Document, renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";

import { BirthdayGuidePage } from "@/components/pdf/pages/BirthdayGuidePage";
import { DestinyGuidePage } from "@/components/pdf/pages/DestinyGuidePage";
import { LifePathGuidePage } from "@/components/pdf/pages/LifePathGuidePage";
import { MaturityGuidePage } from "@/components/pdf/pages/MaturityGuidePage";
import { PersonalYearGuidePage } from "@/components/pdf/pages/PersonalYearIntroPages";
import { PersonalityGuidePage } from "@/components/pdf/pages/PersonalityGuidePage";
import { SoulGuidePage } from "@/components/pdf/pages/SoulGuidePage";
import { setPdfRenderQuality } from "@/components/pdf/pdfRenderQualityState";
import type { PdfRenderQuality } from "@/components/pdf/pdfRenderConfig";
import { ensureJapaneseFont } from "@/components/pdf/registerFonts";
import type { CoreNumberGuideKey } from "@/lib/numerology/pdfCoreNumberGuideCopy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GUIDE_KEYS = new Set<CoreNumberGuideKey>([
  "lifePath",
  "destiny",
  "soul",
  "personality",
  "birthday",
  "maturity",
  "personalYear",
]);

function parseGuideKey(v: string | null): CoreNumberGuideKey {
  if (v && GUIDE_KEYS.has(v as CoreNumberGuideKey)) return v as CoreNumberGuideKey;
  return "soul";
}

function parseQuality(v: string | null): PdfRenderQuality {
  return v === "high" ? "high" : "low";
}

function guidePage(key: CoreNumberGuideKey) {
  switch (key) {
    case "lifePath":
      return <LifePathGuidePage />;
    case "destiny":
      return <DestinyGuidePage />;
    case "soul":
      return <SoulGuidePage />;
    case "personality":
      return <PersonalityGuidePage />;
    case "birthday":
      return <BirthdayGuidePage />;
    case "maturity":
      return <MaturityGuidePage />;
    case "personalYear":
      return <PersonalYearGuidePage />;
  }
}

/**
 * 「〇〇ナンバーとは」1ページだけを即確認（本文ページの `/api/dev/soul-preview` とは別）。
 * 例: /api/dev/number-guide-preview?key=soul&quality=low
 */
export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available outside development." }, { status: 404 });
  }

  const url = new URL(req.url);
  const key = parseGuideKey(url.searchParams.get("key"));
  const quality = parseQuality(url.searchParams.get("quality"));

  setPdfRenderQuality(quality);
  ensureJapaneseFont();
  const buffer = await renderToBuffer(<Document>{guidePage(key)}</Document>);

  return new NextResponse(Buffer.from(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Content-Disposition": `inline; filename="number-guide-${key}-${quality}.pdf"`,
    },
  });
}
