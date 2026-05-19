/**
 * Usage: npx tsx scripts/verify-bridge-after-message-page.tsx
 */
import React from "react";
import { Document, renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";

import { BridgeAfterMessageBleedPage } from "@/components/pdf/pages/BridgeAfterMessageBleedPage";
import { ensureJapaneseFont } from "@/components/pdf/registerFonts";

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).React = React;
  ensureJapaneseFont();
  const buf = await renderToBuffer(
    <Document>
      <BridgeAfterMessageBleedPage />
    </Document>,
  );
  const pages = (await PDFDocument.load(buf)).getPageCount();
  console.log(`bridge-after-message: ${pages} page(s) ${pages === 1 ? "OK" : "FAIL"}`);
  if (pages !== 1) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
