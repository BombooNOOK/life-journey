/**
 * 森の住民票アセット PNG の背景を透明化する。
 * Usage: node scripts/forest-resident-transparentize.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const TARGET_DIR = path.join(process.cwd(), "public/images/ljd/forest-resident");

const CHECKERBOARD_FILES = [
  "forest_resident_face_rabbit.png",
  "forest_resident_body_rabbit.png",
];

const BADGE_FILES = [
  "forest_resident_badge_green.png",
  "forest_resident_badge_silver.png",
  "forest_resident_badge_gold.png",
];

const CARD_FILE = "forest_resident_card.png";

function isCheckerboardPixel(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const spread = max - min;
  if (spread <= 10 && min >= 236) return true;
  if (spread <= 6 && min >= 228) return true;
  return false;
}

function alphaForCheckerboard(r, g, b) {
  if (!isCheckerboardPixel(r, g, b)) return 255;
  const max = Math.max(r, g, b);
  if (max >= 252) return 0;
  const t = (max - 236) / 16;
  return Math.round(Math.max(0, Math.min(1, t)) * 255);
}

function colorDist(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function floodCornerBackground(data, width, height, tolerance = 18) {
  const bg = new Uint8Array(width * height);
  const visited = new Uint8Array(width * height);
  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];
  const seeds = corners.map(([x, y]) => {
    const i = (y * width + x) * 4;
    return { r: data[i], g: data[i + 1], b: data[i + 2] };
  });
  const queue = [...corners];
  for (const [x, y] of corners) visited[y * width + x] = 1;

  while (queue.length > 0) {
    const [x, y] = queue.shift();
    bg[y * width + x] = 1;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const idx = ny * width + nx;
      if (visited[idx]) continue;
      const i = idx * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const match = seeds.some((seed) => colorDist(r, g, b, seed.r, seed.g, seed.b) <= tolerance);
      if (!match) continue;
      visited[idx] = 1;
      queue.push([nx, ny]);
    }
  }

  return bg;
}

async function writePngFromRaw(data, info, filePath) {
  const tmp = `${filePath}.tmp.png`;
  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png()
    .toFile(tmp);
  await fs.rename(tmp, filePath);
}

async function transparentizeCheckerboard(fileName) {
  const filePath = path.join(TARGET_DIR, fileName);
  const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });

  for (let i = 0; i < data.length; i += 4) {
    const alpha = alphaForCheckerboard(data[i], data[i + 1], data[i + 2]);
    data[i + 3] = Math.min(data[i + 3], alpha);
  }

  await writePngFromRaw(data, info, filePath);
  console.log(`checkerboard removed: ${fileName}`);
}

async function transparentizeBadgeOuterMargin(fileName) {
  const filePath = path.join(TARGET_DIR, fileName);
  const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });

  const bg = floodCornerBackground(data, info.width, info.height, 20);
  for (let px = 0; px < info.width * info.height; px++) {
    if (!bg[px]) continue;
    data[px * 4 + 3] = 0;
  }

  await writePngFromRaw(data, info, filePath);
  console.log(`badge outer margin removed: ${fileName}`);
}

async function transparentizeCardOuterMargin(fileName) {
  const filePath = path.join(TARGET_DIR, fileName);
  const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });

  const bg = floodCornerBackground(data, info.width, info.height);
  for (let px = 0; px < info.width * info.height; px++) {
    if (!bg[px]) continue;
    data[px * 4 + 3] = 0;
  }

  await writePngFromRaw(data, info, filePath);
  console.log(`outer margin removed: ${fileName}`);
}

async function main() {
  await fs.mkdir(TARGET_DIR, { recursive: true });
  await Promise.all(CHECKERBOARD_FILES.map((fileName) => transparentizeCheckerboard(fileName)));
  await Promise.all(BADGE_FILES.map((fileName) => transparentizeBadgeOuterMargin(fileName)));
  await transparentizeCardOuterMargin(CARD_FILE);
}

await main();
