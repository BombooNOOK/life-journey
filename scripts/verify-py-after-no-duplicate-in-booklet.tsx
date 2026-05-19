/**
 * 製本PDFに PY章後フクロウが1枚だけ含まれることを確認（旧 insert-4 全面PDFの重複防止）。
 * Usage: npx tsx scripts/verify-py-after-no-duplicate-in-booklet.tsx
 */
import { readFile } from "node:fs/promises";

import pdf from "pdf-parse";
import { PDFDocument } from "pdf-lib";

async function main() {
  const buf = await readFile("sample-booklet.pdf");
  const doc = await PDFDocument.load(buf);
  const total = doc.getPageCount();

  let pagesWithNewAfter = 0;
  let pagesWithOldAfter = 0;

  for (let i = 0; i < total; i++) {
    const single = await PDFDocument.create();
    const [p] = await single.copyPages(doc, [i]);
    single.addPage(p);
    const text = (await pdf(Buffer.from(await single.save()))).text;
    if (text.includes("ゆっくりたどってみてくださいね")) pagesWithNewAfter += 1;
    if (text.includes("こんなときに、ひらいてみてくださいね")) pagesWithOldAfter += 1;
  }

  console.log(`booklet pages: ${total}`);
  console.log(`PY章後（新文言）: ${pagesWithNewAfter} page(s)`);
  console.log(`PY章後（旧文言・全面PDF）: ${pagesWithOldAfter} page(s)`);

  let failed = false;
  if (pagesWithNewAfter !== 1) {
    console.log(`FAIL: expected exactly 1 page with new PY-after copy, got ${pagesWithNewAfter}`);
    failed = true;
  } else {
    console.log("OK: new PY-after message appears once");
  }
  if (pagesWithOldAfter > 0) {
    console.log(`FAIL: legacy PY-after page still present (${pagesWithOldAfter})`);
    failed = true;
  } else {
    console.log("OK: no legacy PY-after page");
  }

  // PDF 48 付近: 旧 bridge-section-cover（文字込み全面）が続いていないこと
  if (total >= 48) {
    const single = await PDFDocument.create();
    const [p] = await single.copyPages(doc, [47]);
    single.addPage(p);
    const p48 = (await pdf(Buffer.from(await single.save()))).text;
    if (p48.includes("こんなときに") || p48.includes("進みたいのに、うまく進めない")) {
      console.log("FAIL: PDF page 48 still looks like legacy PY-after full bleed");
      failed = true;
    } else if (p48.includes("ゆっくりたどって")) {
      console.log("FAIL: PDF page 48 still duplicates PY-after message");
      failed = true;
    } else {
      console.log("OK: PDF page 48 is not a duplicate Fukuro message page");
    }
  }

  if (failed) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
