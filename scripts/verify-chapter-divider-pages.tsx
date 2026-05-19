/**
 * Usage: npx tsx scripts/verify-chapter-divider-pages.tsx
 */
import React from "react";
import { Document, renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";

import { ChapterDividerBleedPage } from "@/components/pdf/pages/ChapterDividerBleedPage";
import { ensureJapaneseFont } from "@/components/pdf/registerFonts";

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).React = React;
  ensureJapaneseFont();
  const buf = await renderToBuffer(
    <Document>
      <ChapterDividerBleedPage chapter={1} />
      <ChapterDividerBleedPage chapter={2} />
      <ChapterDividerBleedPage chapter={3} />
      <ChapterDividerBleedPage chapter={4} />
    </Document>,
  );
  const pages = (await PDFDocument.load(buf)).getPageCount();
  console.log(`chapter-divider: ${pages} page(s) ${pages === 4 ? "OK" : "FAIL"}`);
  if (pages !== 4) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
