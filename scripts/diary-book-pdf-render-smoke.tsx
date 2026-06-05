/**
 * 日記ブックPDF描画の最小切り分け（ローカル）。
 * 実行: npx tsx scripts/diary-book-pdf-render-smoke.tsx
 */
import fs from "node:fs";
import path from "node:path";

import React from "react";
import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";

import { DiaryBookPdfPageCanvas } from "../src/components/pdf/diaryBook/DiaryBookPdfPageCanvas";
import { ensureJapaneseFont } from "../src/components/pdf/registerFonts";
import { diaryCoverImagePath } from "../src/lib/journal/coverAssets";
import { diaryBookBodyTemplatePathForCompanion } from "../src/lib/journal/diaryBookAssets";
import { resolveDiaryBookPublicImagePath } from "../src/lib/journal/diaryBookPrintPdfAssets";
import {
  diaryBookPdfPageCanvasStyle,
  diaryBookPdfPageStyle,
} from "../src/lib/journal/diaryBookPrintPdfLayout";

const outDir = path.join(process.cwd(), "tmp");
const coverSrc = resolveDiaryBookPublicImagePath(diaryCoverImagePath("casual", "owl"));
const bodySrc = resolveDiaryBookPublicImagePath(diaryBookBodyTemplatePathForCompanion("owl"));

const styles = StyleSheet.create({
  text: {
    fontFamily: "NotoSansJP",
    fontSize: 24,
    color: "#000000",
  },
});

async function main() {
  ensureJapaneseFont();

  const doc = (
    <Document>
      <Page size="A5" orientation="portrait" style={diaryBookPdfPageStyle}>
        <View wrap={false} style={diaryBookPdfPageCanvasStyle}>
          <Text style={[styles.text, { marginTop: 40, marginLeft: 40 }]}>1 TEXT ONLY</Text>
        </View>
      </Page>
      <DiaryBookPdfPageCanvas backgroundSrc={coverSrc} />
      <DiaryBookPdfPageCanvas backgroundSrc={coverSrc}>
        <Text style={[styles.text, { marginTop: 40, marginLeft: 40, color: "#ffffff" }]}>
          3 IMAGE + TEXT
        </Text>
      </DiaryBookPdfPageCanvas>
      <DiaryBookPdfPageCanvas backgroundSrc={bodySrc}>
        <Text
          style={[
            styles.text,
            { position: "absolute", left: 170, top: 100, fontSize: 14, color: "#44403c" },
          ]}
        >
          2026年 6月 5日
        </Text>
      </DiaryBookPdfPageCanvas>
    </Document>
  );

  const buffer = await renderToBuffer(doc);
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "diary-book-pdf-render-smoke.pdf");
  fs.writeFileSync(outPath, buffer);
  const pdf = await PDFDocument.load(buffer);
  console.log("written:", outPath, "pages:", pdf.getPageCount(), "bytes:", buffer.byteLength);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
