/**
 * 旧 `chapter-insert-before-4.pdf` を足跡 PNG と同じ1ページPDFに揃える（誤結合時のフクロウ重複防止）。
 * Usage: npx tsx scripts/sync-chapter-insert-before-4-to-transition.tsx
 */
import { readFile, writeFile } from "node:fs/promises";

import { PDFDocument } from "pdf-lib";

import {
  PDF_CHAPTER_INSERT_BEFORE_4_PATH,
  PDF_PERSONAL_YEAR_CHAPTER_TRANSITION_PATH,
} from "@/components/pdf/pdfAssetPaths";

const A5_WIDTH_PT = 419.53;
const A5_HEIGHT_PT = 595.28;

async function main() {
  const pngBytes = await readFile(PDF_PERSONAL_YEAR_CHAPTER_TRANSITION_PATH);
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([A5_WIDTH_PT, A5_HEIGHT_PT]);
  const image =
    pngBytes[0] === 0x89
      ? await pdf.embedPng(pngBytes)
      : await pdf.embedJpg(pngBytes);
  const scale = Math.min(page.getWidth() / image.width, page.getHeight() / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  page.drawImage(image, {
    x: (page.getWidth() - w) / 2,
    y: (page.getHeight() - h) / 2,
    width: w,
    height: h,
  });
  const out = await pdf.save();
  await writeFile(PDF_CHAPTER_INSERT_BEFORE_4_PATH, out);
  const pages = (await PDFDocument.load(out)).getPageCount();
  console.log(`Wrote ${PDF_CHAPTER_INSERT_BEFORE_4_PATH} (${pages} page, ${out.byteLength} bytes)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
