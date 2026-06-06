#!/usr/bin/env node
/**
 * 月索引カレンダー用の肉球マーク（2つ1セット）を透過 PNG で生成する。
 * 旧ファイルは JPEG 拡張子の疑似 PNG（alpha なし・チェッカー焼き込み）だったため差し替え用。
 *
 * 実行: node scripts/build-diary-book-calendar-pawprint.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outPath = path.join(root, "public/images/diary-book-calendar-pawprint.png");

/** 生成り背景に馴染むブラウングレー（ビューワー opacity-85 相当の見え方） */
const PAW_COLOR = "#9a8b7a";

function pawGroup({ cx, cy, rotateDeg, scale = 1 }) {
  const s = scale;
  return `
  <g transform="translate(${cx} ${cy}) rotate(${rotateDeg}) scale(${s})">
    <ellipse cx="0" cy="5" rx="9" ry="11" fill="${PAW_COLOR}" />
    <circle cx="-7" cy="-9" r="3.8" fill="${PAW_COLOR}" />
    <circle cx="0" cy="-11.5" r="3.8" fill="${PAW_COLOR}" />
    <circle cx="7" cy="-9" r="3.8" fill="${PAW_COLOR}" />
    <circle cx="11" cy="-2" r="3.2" fill="${PAW_COLOR}" />
  </g>`;
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" width="72" height="72">
  ${pawGroup({ cx: 22, cy: 24, rotateDeg: -18, scale: 0.92 })}
  ${pawGroup({ cx: 50, cy: 48, rotateDeg: 14, scale: 0.92 })}
</svg>`;

async function main() {
  const sharp = (await import("sharp")).default;

  const png = await sharp(Buffer.from(svg))
    .png()
    .trim({ threshold: 1 })
    .toBuffer();

  const meta = await sharp(png).metadata();
  await fs.writeFile(outPath, png);

  console.log(`Wrote ${outPath}`);
  console.log(`  format: ${meta.format}, hasAlpha: ${meta.hasAlpha}`);
  console.log(`  size: ${meta.width}x${meta.height}, bytes: ${png.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
