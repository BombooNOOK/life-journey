/**
 * 7種「〇〇ナンバーとは」が各1ページに収まるか確認
 * Usage: npx tsx scripts/verify-number-guide-pages.tsx
 */
import React from "react";
import { Document, renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";

import { BirthdayGuidePage } from "@/components/pdf/pages/BirthdayGuidePage";
import { DestinyGuidePage } from "@/components/pdf/pages/DestinyGuidePage";
import { LifePathGuidePage } from "@/components/pdf/pages/LifePathGuidePage";
import { MaturityGuidePage } from "@/components/pdf/pages/MaturityGuidePage";
import { PersonalYearGuidePage } from "@/components/pdf/pages/PersonalYearIntroPages";
import { PersonalityGuidePage } from "@/components/pdf/pages/PersonalityGuidePage";
import { SoulGuidePage } from "@/components/pdf/pages/SoulGuidePage";
import { ReportPdfPages } from "@/components/pdf/ReportPdfPages";
import { setPdfRenderQuality } from "@/components/pdf/pdfRenderQualityState";
import { setPdfPageNumberOffset } from "@/components/pdf/pdfPageNumberOffset";
import { ensureJapaneseFont } from "@/components/pdf/registerFonts";
import { getSampleBookletOrder } from "@/lib/pdf/sampleBookletOrder";

const GUIDE_PAGES: { label: string; element: React.ReactElement }[] = [
  { label: "lifePath", element: <LifePathGuidePage /> },
  { label: "destiny", element: <DestinyGuidePage /> },
  { label: "soul", element: <SoulGuidePage /> },
  { label: "personality", element: <PersonalityGuidePage /> },
  { label: "birthday", element: <BirthdayGuidePage /> },
  { label: "maturity", element: <MaturityGuidePage /> },
  { label: "personalYear", element: <PersonalYearGuidePage /> },
];

async function pageCount(buf: Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(buf);
  return doc.getPageCount();
}

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).React = React;
  ensureJapaneseFont();
  const order = getSampleBookletOrder();
  let failed = false;

  for (const quality of ["high", "low"] as const) {
    setPdfRenderQuality(quality);
    console.log(`--- ${quality} ---`);
    for (const { label, element } of GUIDE_PAGES) {
      const buf = await renderToBuffer(
        <Document>
          {element}
        </Document>,
      );
      const pages = await pageCount(buf);
      const ok = pages === 1;
      console.log(`  ${label}: ${pages} page(s) ${ok ? "OK" : "FAIL"}`);
      if (!ok) failed = true;
    }
    setPdfPageNumberOffset(0);
    const segBuf = await renderToBuffer(
      <Document>
        <ReportPdfPages
          order={order}
          segment="beforeChapter3Insert"
          renderConfig={{ focusPage: "all", quality }}
        />
      </Document>,
    );
    const seg = await pageCount(segBuf);
    console.log(`  beforeChapter3Insert segment: ${seg} page(s)`);
  }

  if (failed) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
