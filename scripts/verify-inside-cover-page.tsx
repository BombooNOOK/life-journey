/**
 * Usage: npx tsx scripts/verify-inside-cover-page.tsx
 */
import React from "react";
import { Document, renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";

import { InsideCoverPage } from "@/components/pdf/pages/InsideCoverPage";
import { ensureJapaneseFont } from "@/components/pdf/registerFonts";
import { getSampleBookletOrder } from "@/lib/pdf/sampleBookletOrder";

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).React = React;
  ensureJapaneseFont();
  const buf = await renderToBuffer(
    <Document>
      <InsideCoverPage customer={getSampleBookletOrder()} />
    </Document>,
  );
  const pages = (await PDFDocument.load(buf)).getPageCount();
  console.log(`inside-cover: ${pages} page(s) ${pages === 1 ? "OK" : "FAIL"}`);
  if (pages !== 1) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
