import path from "node:path";
import fs from "node:fs";

import { Font } from "@react-pdf/renderer";

let registered = false;

// 日本語PDFで英語用の自動ハイフネーションが走らないよう、グローバルに無効化する
Font.registerHyphenationCallback((word: string) => [word]);

function pickExistingPath(candidates: string[]): string {
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(`Font file not found. checked: ${candidates.join(", ")}`);
}

const notoJpDir = path.join(process.cwd(), "node_modules/@fontsource/noto-sans-jp/files");

export function ensureJapaneseFont(): void {
  if (registered) return;
  // NOTE:
  // - @fontsource/noto-sans-jp は「unicode subset」ごとにファイルが分割されており、
  //   バージョン差で `noto-sans-jp-japanese-*` のような命名が存在しないことがあります。
  // - ここでは「まず1サブセット（=日本語を含む可能性が高い）」→「なければ0サブセット」で探します。
  const w400 = pickExistingPath([
    path.join(notoJpDir, "noto-sans-jp-1-400-normal.woff2"),
    path.join(notoJpDir, "noto-sans-jp-1-400-normal.woff"),
    path.join(notoJpDir, "noto-sans-jp-0-400-normal.woff2"),
    path.join(notoJpDir, "noto-sans-jp-0-400-normal.woff"),
  ]);
  const w700 = pickExistingPath([
    path.join(notoJpDir, "noto-sans-jp-1-700-normal.woff2"),
    path.join(notoJpDir, "noto-sans-jp-1-700-normal.woff"),
    path.join(notoJpDir, "noto-sans-jp-0-700-normal.woff2"),
    path.join(notoJpDir, "noto-sans-jp-0-700-normal.woff"),
  ]);
  Font.register({
    family: "NotoSansJP",
    fonts: [
      { src: w400, fontWeight: 400 },
      { src: w700, fontWeight: 700 },
    ],
  });
  registered = true;
}
