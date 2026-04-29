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

function pickByFilenameRegex(filenameRegex: RegExp, preferExt: Array<"woff2" | "woff">): string {
  if (!fs.existsSync(notoJpDir)) {
    throw new Error(`Font directory not found: ${notoJpDir}`);
  }
  const entries = fs.readdirSync(notoJpDir);

  // Prefer woff2 (smaller + commonly available), then woff.
  for (const ext of preferExt) {
    const hit = entries.find((name) => filenameRegex.test(name) && name.endsWith(`.${ext}`));
    if (hit) return path.join(notoJpDir, hit);
  }
  const anyHit = entries.find((name) => filenameRegex.test(name));
  if (anyHit) return path.join(notoJpDir, anyHit);

  throw new Error(
    `Font file not found by regex. dir=${notoJpDir}, regex=${filenameRegex}, samples=${entries.slice(
      0,
      10,
    )}`,
  );
}

export function ensureJapaneseFont(): void {
  if (registered) return;

  // react-pdf はサーバーレス環境でフォントファイルが「想定と違う名前」になっても壊れないよう、
  // 実在するファイル名をディレクトリから動的に選びます。
  const w400 = pickByFilenameRegex(/^noto-sans-jp-\d+-400-normal\.(woff|woff2)$/, ["woff2", "woff"]);
  const w700 = pickByFilenameRegex(/^noto-sans-jp-\d+-700-normal\.(woff|woff2)$/, ["woff2", "woff"]);

  Font.register({
    family: "NotoSansJP",
    fonts: [
      { src: w400, fontWeight: 400 },
      { src: w700, fontWeight: 700 },
    ],
  });
  registered = true;
}
