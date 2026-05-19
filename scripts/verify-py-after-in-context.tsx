/**
 * PY章後メッセージを前後ページと一緒にレンダし、ページ数を確認。
 * Usage: npx tsx scripts/verify-py-after-in-context.tsx
 */
import React from "react";
import { Document, renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";

import { PersonalYearDetailPages } from "@/components/pdf/pages/PersonalYearDetailPages";
import { PersonalYearChapterTransitionPage } from "@/components/pdf/pages/PersonalYearChapterTransitionPage";
import { PersonalYearAfterMessageBleedPage } from "@/components/pdf/pages/PersonalYearAfterMessageBleedPage";
import { Chapter3DividerPage } from "@/components/pdf/pages/Chapter3DividerPage";
import { ensureJapaneseFont } from "@/components/pdf/registerFonts";

async function pageCount(bytes: Uint8Array): Promise<number> {
  return (await PDFDocument.load(bytes)).getPageCount();
}

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).React = React;
  ensureJapaneseFont();

  const birthMonth = 5;
  const birthDay = 14;
  const referenceDate = new Date("2026-05-16");

  const buf = await renderToBuffer(
    <Document>
      <PersonalYearDetailPages
        birthMonth={birthMonth}
        birthDay={birthDay}
        referenceDate={referenceDate}
      />
      <PersonalYearChapterTransitionPage />
      <PersonalYearAfterMessageBleedPage />
      <Chapter3DividerPage />
    </Document>,
  );
  const pages = (await PDFDocument.load(buf)).getPageCount();
  // 9 detail + 1 transition + 1 after + 1 ch3扉 = 12
  const expected = 12;
  console.log(`py-tail segment: ${pages} page(s) (expected ${expected}) ${pages === expected ? "OK" : "FAIL"}`);

  const transitionThenAfter = await pageCount(
    await renderToBuffer(
      <Document>
        <PersonalYearChapterTransitionPage />
        <PersonalYearAfterMessageBleedPage />
      </Document>,
    ),
  );
  if (transitionThenAfter !== 2) {
    console.log(`FAIL: 足跡+章後フクロウ expected 2 pages, got ${transitionThenAfter}`);
    process.exitCode = 1;
  } else {
    console.log("OK: 足跡+章後フクロウ 2 pages (フクロウは1枚のみ)");
  }
  if (pages !== expected) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
