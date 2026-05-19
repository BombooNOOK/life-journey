/**
 * ライフパス「とは」パイロット確認: 1ページ・セグメント総ページ数
 * Usage: npx tsx scripts/verify-lp-guide-pilot.tsx
 */
import React from "react";
import { Document, renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";

import { LifePathGuidePage } from "@/components/pdf/pages/LifePathGuidePage";
import { ReportPdfPages } from "@/components/pdf/ReportPdfPages";
import { setPdfRenderQuality } from "@/components/pdf/pdfRenderQualityState";
import { setPdfPageNumberOffset } from "@/components/pdf/pdfPageNumberOffset";
import { ensureJapaneseFont } from "@/components/pdf/registerFonts";
import { getSampleBookletOrder } from "@/lib/pdf/sampleBookletOrder";

async function pageCount(buf: Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(buf);
  return doc.getPageCount();
}

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).React = React;
  ensureJapaneseFont();
  const order = getSampleBookletOrder();

  for (const quality of ["high", "low"] as const) {
    setPdfRenderQuality(quality);
    const soloBuf = await renderToBuffer(
      <Document>
        <LifePathGuidePage />
      </Document>,
    );
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
    const solo = await pageCount(soloBuf);
    const seg = await pageCount(segBuf);
    console.log(
      `${quality}: LifePathGuide solo=${solo} page(s), beforeChapter3Insert segment=${seg} page(s)`,
    );
    if (solo !== 1) process.exitCode = 1;
  }
  console.log("TOC ref: ライフ・パス・ナンバー …… 8 (CustomerPage.tsx, unchanged)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
