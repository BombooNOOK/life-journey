/**
 * Usage: npx tsx scripts/render-soul-guide-check.tsx
 */
import fs from "node:fs";

import React from "react";
import { Document, renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";

import { SoulGuidePage } from "@/components/pdf/pages/SoulGuidePage";
import { ensureJapaneseFont } from "@/components/pdf/registerFonts";
import { getCoreNumberGuideCopy } from "@/lib/numerology/pdfCoreNumberGuideCopy";

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).React = React;
  ensureJapaneseFont();
  const copy = getCoreNumberGuideCopy("soul");
  const ok =
    copy.body.includes("~本当は") &&
    copy.body.includes("自分でも気づかないうちに、\n心の声") &&
    copy.body.includes("ほんとうは何を求めているのだろう」\nと、");
  console.log("copy markers ok:", ok);
  if (!ok) process.exitCode = 1;

  const buf = await renderToBuffer(
    <Document>
      <SoulGuidePage />
    </Document>,
  );
  const out = "/tmp/soul-guide-check.pdf";
  fs.writeFileSync(out, buf);
  const doc = await PDFDocument.load(buf);
  console.log("written", out, "pages", doc.getPageCount(), "bytes", buf.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
