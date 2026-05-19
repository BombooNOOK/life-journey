/**
 * はじめに 1P・2P が各 1 ページに収まるか確認
 * Usage: npx tsx scripts/verify-introduction-pages.tsx
 */
import React from "react";
import { Document, renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";

import { IntroductionPage1 } from "@/components/pdf/pages/IntroductionPage1";
import { IntroductionPage2 } from "@/components/pdf/pages/IntroductionPage2";
import { ensureJapaneseFont } from "@/components/pdf/registerFonts";

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).React = React;
  ensureJapaneseFont();
  let failed = false;

  for (const [label, Page] of [
    ["page1", IntroductionPage1],
    ["page2", IntroductionPage2],
  ] as const) {
    const buf = await renderToBuffer(
      <Document>
        <Page />
      </Document>,
    );
    const doc = await PDFDocument.load(buf);
    const pages = doc.getPageCount();
    const ok = pages === 1;
    console.log(`introduction ${label}: ${pages} page(s) ${ok ? "OK" : "FAIL"}`);
    if (!ok) failed = true;
  }

  if (failed) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
