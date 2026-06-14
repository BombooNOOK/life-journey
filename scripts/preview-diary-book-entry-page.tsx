/**
 * 日記ブック本文ページだけを1枚PDFで確認する（DB不要）。
 *
 * 実行: npm run preview:diary-entry
 * 1ページ目＝写真なし、2ページ目＝写真あり
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

import React from "react";
import { Document, renderToBuffer } from "@react-pdf/renderer";

import type { BoundDiaryEntry } from "../src/components/journal/DiaryYearBoundPages";
import { DiaryBookEntryPdfPage } from "../src/components/pdf/diaryBook/DiaryBookEntryPdfPage";
import { ensureJapaneseFont } from "../src/components/pdf/registerFonts";
import { resolveDiaryBookPublicImagePath } from "../src/lib/journal/diaryBookPrintPdfAssets";

import { CONTENT_FONT_MODE_LABELS_JA, type ContentFontMode } from "../src/lib/journal/contentFontMode";

const SAMPLE_BODY =
  "今日はハリネズミのふくろうと一緒に、\nのんびりお散歩をしました。\n公園のベンチで少し休みながら、木漏れ日を眺めていました。\n穏やかな時間がとても心地よかったです。";

const FONT_MODES = ["relaxed", "standard", "generous", "compact"] as const satisfies readonly ContentFontMode[];

const SAMPLE_ENTRY_BASE = {
  id: "preview-entry",
  content: SAMPLE_BODY,
  createdAt: "2026-06-06T10:00:00.000Z",
  mood: "calm",
  activity: "record_anyway",
  companionType: "owl",
  generatedComment:
    "穏やかな一日の記録、とても素敵ですね。特別な出来事がなくても、日々を丁寧に残すこと自体が、あなたらしい歩みの証です。木漏れ日を眺める時間は、心を整える大切なひとときです。",
  contentFontMode: "standard",
  diaryNumbers: { today: 8, month: 5, year: 6, calmness: 3 },
} as const satisfies Omit<BoundDiaryEntry, "hasPhoto">;

const OUT_PATH = path.join(process.cwd(), "tmp", "diary-book-entry-preview.pdf");
const OUT_PATH_WITH_PHOTO = path.join(
  process.cwd(),
  "tmp",
  "diary-book-entry-preview-with-photo.pdf",
);
const OUT_PATH_MODES = path.join(process.cwd(), "tmp", "diary-book-entry-preview-modes.pdf");

async function main() {
  const photoPath = resolveDiaryBookPublicImagePath(
    "/images/profile-cards/profile-card-hedgehog.png",
  );

  const entryWithoutPhoto: BoundDiaryEntry = { ...SAMPLE_ENTRY_BASE, hasPhoto: false };
  const entryWithPhoto: BoundDiaryEntry = { ...SAMPLE_ENTRY_BASE, hasPhoto: true };

  ensureJapaneseFont();
  const [bufferBoth, bufferPhoto, bufferModes] = await Promise.all([
    renderToBuffer(
      <Document>
        <DiaryBookEntryPdfPage entry={entryWithoutPhoto} />
        <DiaryBookEntryPdfPage entry={entryWithPhoto} photoDataUri={photoPath} />
      </Document>,
    ),
    renderToBuffer(
      <Document>
        <DiaryBookEntryPdfPage entry={entryWithPhoto} photoDataUri={photoPath} />
      </Document>,
    ),
    renderToBuffer(
      <Document>
        {FONT_MODES.map((mode) => (
          <DiaryBookEntryPdfPage
            key={mode}
            entry={{ ...SAMPLE_ENTRY_BASE, contentFontMode: mode, hasPhoto: false }}
          />
        ))}
      </Document>,
    ),
  ]);

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, bufferBoth);
  fs.writeFileSync(OUT_PATH_WITH_PHOTO, bufferPhoto);
  fs.writeFileSync(OUT_PATH_MODES, bufferModes);

  const desktopBoth = path.join(
    process.env.HOME ?? "",
    "Desktop",
    "日記ブック_本文プレビュー.pdf",
  );
  const desktopPhoto = path.join(
    process.env.HOME ?? "",
    "Desktop",
    "日記ブック_本文プレビュー_写真あり.pdf",
  );
  const desktopModes = path.join(
    process.env.HOME ?? "",
    "Desktop",
    "日記ブック_本文プレビュー_4モード.pdf",
  );
  fs.copyFileSync(OUT_PATH, desktopBoth);
  fs.copyFileSync(OUT_PATH_WITH_PHOTO, desktopPhoto);
  fs.copyFileSync(OUT_PATH_MODES, desktopModes);

  console.log("");
  console.log("✅ プレビューPDFを作りました");
  console.log("");
  console.log("  写真なし:", desktopBoth);
  console.log("  写真あり:", desktopPhoto);
  console.log(
    "  4モード比較:",
    desktopModes,
    `（${FONT_MODES.map((m) => CONTENT_FONT_MODE_LABELS_JA[m]).join("→")}）`,
  );
  console.log("");
  console.log("  ※ 両方入り版は 1枚目=写真なし / 2枚目=写真あり です");
  console.log("");

  if (process.platform === "darwin") {
    execSync(`open "${desktopModes}"`);
  }
}

main().catch((e) => {
  console.error("");
  console.error("❌ プレビューPDFの作成に失敗しました");
  console.error(e);
  process.exit(1);
});
