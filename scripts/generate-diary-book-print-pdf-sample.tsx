/**
 * 管理者PDF API と同じ経路でサンプル製本PDFを生成する（ローカル検証用）。
 *
 * 実行: npx tsx scripts/generate-diary-book-print-pdf-sample.tsx [requestId]
 */
import fs from "node:fs";
import path from "node:path";

import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { PrismaClient } from "@prisma/client";

import { DiaryBookPrintDocument } from "../src/components/pdf/diaryBook/DiaryBookPrintDocument";
import { ensureJapaneseFont } from "../src/components/pdf/registerFonts";
import { diaryBookPrintPdfFilename } from "../src/lib/journal/diaryBookPrintPdfFilename";
import { loadDiaryBookPrintPdfPayload } from "../src/lib/journal/diaryBookPrintPdfData";

const prisma = new PrismaClient();

async function main() {
  const requestIdArg = process.argv[2]?.trim();
  const request = requestIdArg
    ? await prisma.diaryBookBindingRequest.findUnique({ where: { id: requestIdArg } })
    : await prisma.diaryBookBindingRequest.findFirst({
        where: { diaryBookId: { not: null } },
        orderBy: { createdAt: "desc" },
      });

  if (!request) {
    throw new Error("日記ブック製本申込が見つかりません。");
  }

  console.log("request:", request.id, request.diaryBindingCode, request.diaryBookId);

  const payload = await loadDiaryBookPrintPdfPayload(request.id);
  console.log("pages:", payload.pages.length);
  console.log(
    "photo entries:",
    Object.keys(payload.photoDataUriByEntryId).length,
  );

  ensureJapaneseFont();
  const buffer = await renderToBuffer(<DiaryBookPrintDocument {...payload} />);

  const outDir = path.join(process.cwd(), "tmp");
  fs.mkdirSync(outDir, { recursive: true });
  const filename = diaryBookPrintPdfFilename(payload.bindingCode);
  const outPath = path.join(outDir, filename);
  fs.writeFileSync(outPath, buffer);

  console.log("written:", outPath, `(${buffer.byteLength} bytes)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
