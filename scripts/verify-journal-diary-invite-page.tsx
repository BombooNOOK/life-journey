/**
 * Usage: npx tsx scripts/verify-journal-diary-invite-page.tsx
 */
import React from "react";
import { Document, renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";

import { JournalDiaryInviteBleedPage } from "@/components/pdf/pages/JournalDiaryInviteBleedPage";
import { ensureJapaneseFont } from "@/components/pdf/registerFonts";

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).React = React;
  ensureJapaneseFont();
  const buf = await renderToBuffer(
    <Document>
      <JournalDiaryInviteBleedPage />
    </Document>,
  );
  const pages = (await PDFDocument.load(buf)).getPageCount();
  console.log(`journal-diary-invite: ${pages} page(s) ${pages === 1 ? "OK" : "FAIL"}`);
  if (pages !== 1) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
