/**
 * Usage: npx tsx scripts/verify-personal-year-detail-pages.tsx
 */
import React from "react";
import { Document, renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";

import { YearDetailPage } from "@/components/pdf/pages/PersonalYearDetailPages";
import { buildPersonalYearNineYearRows } from "@/lib/numerology/personalYearMonth";
import { ensureJapaneseFont } from "@/components/pdf/registerFonts";

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).React = React;
  ensureJapaneseFont();

  const birthMonth = 5;
  const birthDay = 14;
  const referenceDate = new Date("2026-05-16");

  const rows = buildPersonalYearNineYearRows(birthMonth, birthDay, referenceDate);

  const buf = await renderToBuffer(
    <Document>
      {rows.map((row) => (
        <YearDetailPage key={row.calendarYear} row={row} />
      ))}
    </Document>,
  );
  const pages = (await PDFDocument.load(buf)).getPageCount();
  const expected = rows.length;
  console.log(
    `personal-year-detail: ${pages} page(s) (expected ${expected}) ${pages === expected ? "OK" : "EXTRA"}`,
  );

  for (const row of rows) {
    const oneBuf = await renderToBuffer(
      <Document>
        <YearDetailPage row={row} />
      </Document>,
    );
    const onePages = (await PDFDocument.load(oneBuf)).getPageCount();
    if (onePages !== 1) {
      console.log(`  overflow: ${row.calendarYear} -> ${onePages} page(s)`);
    }
  }

  if (pages !== expected) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
