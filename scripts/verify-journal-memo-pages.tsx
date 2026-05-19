/**
 * Usage: npx tsx scripts/verify-journal-memo-pages.tsx
 */
import React from "react";
import { Document, renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";

import { JournalMemoBleedPage } from "@/components/pdf/pages/JournalMemoBleedPage";
import { ensureJapaneseFont } from "@/components/pdf/registerFonts";

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).React = React;
  ensureJapaneseFont();
  const buf = await renderToBuffer(
    <Document>
      <JournalMemoBleedPage page="left" />
      <JournalMemoBleedPage page="right" />
    </Document>,
  );
  const pages = (await PDFDocument.load(buf)).getPageCount();
  console.log(`journal-memo: ${pages} page(s) ${pages === 2 ? "OK" : "FAIL"}`);
  if (pages !== 2) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
