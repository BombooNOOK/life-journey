/**
 * 伴走保存・森届け演出 PNG の近白背景を透明化する。
 * Usage: node scripts/companion-save-forest-transparentize.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const TARGET_DIR = path.join(process.cwd(), "public/images/ljd/companion-save");

const FILES = [
  "companion_save_forest_01_book_start.png",
  "companion_save_forest_02_book_flying.png",
  "companion_save_forest_03_book_arrived.png",
];

function alphaForCreamPixel(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const spread = max - min;

  // ほぼ白〜クリーム（彩度が低い明るい色）を透明寄せにする
  if (max >= 238 && spread <= 28) return 0;
  if (max >= 220 && spread <= 36) {
    const t = (max - 220) / 18;
    return Math.round(Math.max(0, Math.min(255, t * 255)));
  }
  if (max >= 200 && spread <= 42 && r >= g - 8 && g >= b - 18) {
    const t = (max - 200) / 20;
    return Math.round(Math.max(0, Math.min(255, t * 220)));
  }
  return 255;
}

async function transparentize(fileName) {
  const filePath = path.join(TARGET_DIR, fileName);
  const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });

  const pixels = Buffer.from(data);
  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = alphaForCreamPixel(pixels[i], pixels[i + 1], pixels[i + 2]);
    pixels[i + 3] = Math.min(pixels[i + 3], alpha);
  }

  await sharp(pixels, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png()
    .toFile(filePath);

  console.log(`transparentized: ${fileName}`);
}

async function main() {
  await Promise.all(FILES.map((fileName) => transparentize(fileName)));
}

await main();
