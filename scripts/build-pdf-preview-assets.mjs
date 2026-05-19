#!/usr/bin/env node
/**
 * `assets/` の PNG を縮小して `assets-preview/` に JPEG で出力する（例: foo.png → foo.jpg）。
 * プレビュー版PDF（quality=low）は `resolvePdfAssetPath` が .jpg を優先参照（レイアウトは同一・画像だけ軽量化）。
 *
 * 環境変数（省略時はデフォルト）:
 *   PREVIEW_MAX_EDGE      … 長辺上限 px（既定 720）
 *   PREVIEW_JPEG_QUALITY  … JPEG 品質 1–100（既定 60）
 *
 * 透過 PNG は JPEG 化前に白で合成する（未処理だと透明→黒になり、星・上端帯が黒く見える）。
 *
 * 例:
 *   npm run pdf:preview-assets
 *   PREVIEW_MAX_EDGE=720 PREVIEW_JPEG_QUALITY=60 npm run pdf:preview-assets
 *   npm run pdf:preview-assets:legacy
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function parseEnvInt(name, fallback, { min, max }) {
  const raw = process.env[name];
  if (raw == null || raw.trim() === "") return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < min || n > max) {
    console.warn(`${name}="${raw}" は無効のため既定値 ${fallback} を使います。`);
    return fallback;
  }
  return n;
}

/** 長辺の上限（px）。画面閲覧用プレビュー向け */
const PREVIEW_MAX_EDGE = parseEnvInt("PREVIEW_MAX_EDGE", 720, { min: 240, max: 2400 });
/** JPEG 品質（1–100） */
const PREVIEW_JPEG_QUALITY = parseEnvInt("PREVIEW_JPEG_QUALITY", 60, { min: 1, max: 100 });

const PREVIEW_FLATTEN_BACKGROUND = { r: 255, g: 255, b: 255 };

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

  console.log(
    `Settings: PREVIEW_MAX_EDGE=${PREVIEW_MAX_EDGE} PREVIEW_JPEG_QUALITY=${PREVIEW_JPEG_QUALITY}`,
  );

  await fs.mkdir(outDir, { recursive: true });
  const files = await fs.readdir(srcDir);
  const pngs = files.filter((f) => f.toLowerCase().endsWith(".png"));
  let n = 0;
  let totalBytes = 0;
  for (const name of pngs) {
    const inPath = path.join(srcDir, name);
    const stem = name.replace(/\.png$/i, "");
    const outName = `${stem}.jpg`;
    const outPath = path.join(outDir, outName);
    const legacyPngPath = path.join(outDir, name);

    await sharp(inPath)
      .resize({
        width: PREVIEW_MAX_EDGE,
        height: PREVIEW_MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .flatten({ background: PREVIEW_FLATTEN_BACKGROUND })
      .jpeg({ quality: PREVIEW_JPEG_QUALITY, mozjpeg: true })
      .toFile(outPath);

    try {
      await fs.unlink(legacyPngPath);
    } catch {
      /* 旧形式の preview PNG が無ければスキップ */
    }

    n += 1;
    const st = await fs.stat(outPath);
    totalBytes += st.size;
    const kb = Math.round(st.size / 1024);
    console.log(`preview: ${outName} (${kb} KB)`);
  }
  console.log(`Done. ${n} PNG → ${outDir} (total ${(totalBytes / 1024 / 1024).toFixed(2)} MB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
