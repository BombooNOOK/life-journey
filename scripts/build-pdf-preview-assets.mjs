#!/usr/bin/env node
/**
 * `assets/` の PNG を縮小・再圧縮して `assets-preview/` に出力する。
 * プレビュー版PDF（quality=low）は同名ファイルがあればこちらを参照する（レイアウトは同一・画像だけ軽量化）。
 *
 * 事前に devDependency の sharp を入れてください: npm install
 * 実行: npm run pdf:preview-assets
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(root, "src/components/pdf/assets");
const outDir = path.join(root, "src/components/pdf/assets-preview");

async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error("sharp が未インストールです。`npm install`（devDependency）を実行してください。");
    process.exit(1);
  }

  await fs.mkdir(outDir, { recursive: true });
  const files = await fs.readdir(srcDir);
  const pngs = files.filter((f) => f.toLowerCase().endsWith(".png"));
  let n = 0;
  for (const name of pngs) {
    const inPath = path.join(srcDir, name);
    const outPath = path.join(outDir, name);
    await sharp(inPath)
      .resize({
        width: 1200,
        height: 1200,
        fit: "inside",
        withoutEnlargement: true,
      })
      .png({ compressionLevel: 9 })
      .toFile(outPath);
    n += 1;
    console.log("preview:", name);
  }
  console.log(`Done. ${n} PNG → ${outDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
