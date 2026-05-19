/**
 * はじめに 1P が 1 ページに収まるか確認
 * Usage: npx tsx scripts/verify-introduction-page1.tsx
 */
import React from "react";
import { Document, renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";

import { IntroductionPage1 } from "@/components/pdf/pages/IntroductionPage1";
import { ensureJapaneseFont } from "@/components/pdf/registerFonts";

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).React = React;
  ensureJapaneseFont();
  const buf = await renderToBuffer(
    <Document>
      <IntroductionPage1 />
    </Document>,
  );
  const doc = await PDFDocument.load(buf);
  const pages = doc.getPageCount();
  console.log(`introduction page1: ${pages} page(s) ${pages === 1 ? "OK" : "FAIL"}`);
  if (pages !== 1) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
