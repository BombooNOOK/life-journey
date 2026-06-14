/**
 * きおくの足あと枠スタイル比較プレビュー（DB不要）。
 *
 * 実行: npm run preview:diary-entry-frame
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

import React from "react";
import { Document, renderToBuffer } from "@react-pdf/renderer";

import type { BoundDiaryEntry } from "../src/components/journal/DiaryYearBoundPages";
import { DiaryBookEntryPdfPage } from "../src/components/pdf/diaryBook/DiaryBookEntryPdfPage";
import { ensureJapaneseFont } from "../src/components/pdf/registerFonts";
import { DIARY_BOOK_ENTRY_BODY_FRAME_PREVIEW_VARIANTS } from "../src/lib/journal/diaryBookEntryBodyFramePreview";

const SAMPLE_BODY =
  "今日はハリネズミのふくろうと一緒に、\nのんびりお散歩をしました。\n公園のベンチで少し休みながら、木漏れ日を眺めていました。\n穏やかな時間がとても心地よかったです。";

const SAMPLE_ENTRY: BoundDiaryEntry = {
  id: "preview-entry-frame",
  content: SAMPLE_BODY,
  createdAt: "2026-06-06T10:00:00.000Z",
  mood: "calm",
  activity: "record_anyway",
  companionType: "owl",
  generatedComment:
    "穏やかな一日の記録、とても素敵ですね。特別な出来事がなくても、日々を丁寧に残すこと自体が、あなたらしい歩みの証です。木漏れ日を眺める時間は、心を整える大切なひとときです。",
  contentFontMode: "standard",
  diaryNumbers: { today: 8, month: 5, year: 6, calmness: 3 },
  hasPhoto: false,
};

const OUT_PATH = path.join(process.cwd(), "tmp", "diary-book-entry-frame-preview.pdf");
const OUT_PATH_PAWPRINT = path.join(process.cwd(), "tmp", "diary-book-entry-pawprint-preview.pdf");

async function main() {
  ensureJapaneseFont();
  const buffer = await renderToBuffer(
    <Document>
      {DIARY_BOOK_ENTRY_BODY_FRAME_PREVIEW_VARIANTS.map((variant) => (
        <DiaryBookEntryPdfPage
          key={variant.id}
          entry={SAMPLE_ENTRY}
          bodyFramePreviewVariant={variant.id}
          showBodyFramePreviewLabel
        />
      ))}
    </Document>,
  );

  const pawprintOnlyBuffer = await renderToBuffer(
    <Document>
      <DiaryBookEntryPdfPage
        entry={SAMPLE_ENTRY}
        bodyFramePreviewVariant="none-pawprint"
        showBodyFramePreviewLabel
      />
    </Document>,
  );

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, buffer);
  fs.writeFileSync(OUT_PATH_PAWPRINT, pawprintOnlyBuffer);

  const desktopPath = path.join(
    process.env.HOME ?? "",
    "Desktop",
    "日記ブック_本文枠比較.pdf",
  );
  const desktopPawprintPath = path.join(
    process.env.HOME ?? "",
    "Desktop",
    "日記ブック_きおくの足あと_足跡プレビュー.pdf",
  );
  fs.copyFileSync(OUT_PATH, desktopPath);
  fs.copyFileSync(OUT_PATH_PAWPRINT, desktopPawprintPath);

  console.log("");
  console.log("✅ 本文枠スタイル比較PDFを作りました");
  console.log("");
  console.log("  比較（全パターン）:", desktopPath);
  console.log("  足跡のみ:", desktopPawprintPath);
  console.log("");
  DIARY_BOOK_ENTRY_BODY_FRAME_PREVIEW_VARIANTS.forEach((variant, index) => {
    console.log(`  ${index + 1}ページ目: ${variant.label}`);
  });
  console.log("");

  if (process.platform === "darwin") {
    execSync(`open "${desktopPawprintPath}"`);
  }
}

main().catch((e) => {
  console.error("");
  console.error("❌ 比較PDFの作成に失敗しました");
  console.error(e);
  process.exit(1);
});
