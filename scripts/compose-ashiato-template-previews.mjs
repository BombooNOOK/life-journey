/**
 * レイヤー型あしあとテンプレ preview 合成（background + photo_overlay）。
 *
 * 白背景 overlay は「角＋写真穴からの塗りつぶし」だけ透明化する
 * （全体の近白透過はフクロウ等を削るので使わない）。
 *
 * Usage: node scripts/compose-ashiato-template-previews.mjs
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.join(process.cwd(), "public/images/ashiato");
const NEAR_WHITE = 248;

const TARGETS = [
  {
    background: "ashiato_template_mori_enikki_background.png",
    overlay: "ashiato_template_mori_enikki_photo_overlay.png",
    preview: "ashiato_template_mori_enikki_preview.png",
    innerSeed: [360, 280],
  },
  {
    background: "ashiato_template_mori_yohaku_note_background.png",
    overlay: "ashiato_template_mori_yohaku_note_photo_overlay.png",
    preview: "ashiato_template_mori_yohaku_note_preview.png",
    innerSeed: [250, 220],
  },
];

function isNearWhite(r, g, b, thr = NEAR_WHITE) {
  return r >= thr && g >= thr && b >= thr;
}

function floodTransparent(data, width, height, seeds, thr = NEAR_WHITE) {
  const seen = new Uint8Array(width * height);
  const q = [];
  for (const [sx, sy] of seeds) {
    if (sx < 0 || sy < 0 || sx >= width || sy >= height) continue;
    const i = sy * width + sx;
    if (seen[i]) continue;
    seen[i] = 1;
    q.push(i);
  }
  while (q.length) {
    const i = q.pop();
    const o = i * 4;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    if (!isNearWhite(r, g, b, thr)) continue;
    data[o + 3] = 0;
    const x = i % width;
    const y = (i / width) | 0;
    for (const [nx, ny] of [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ]) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const ni = ny * width + nx;
      if (seen[ni]) continue;
      seen[ni] = 1;
      q.push(ni);
    }
  }
}

async function ensureOverlayTransparent(overlayPath, innerSeed) {
  const meta = await sharp(overlayPath).metadata();
  if (meta.hasAlpha) {
    return; // already prepared
  }

  const { data, info } = await sharp(overlayPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const outerSeeds = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
    [width >> 1, 0],
    [0, height >> 1],
    [width - 1, height >> 1],
    [width >> 1, height - 1],
  ];
  floodTransparent(data, width, height, outerSeeds);
  floodTransparent(data, width, height, [innerSeed]);

  await sharp(data, {
    raw: { width, height, channels: 4 },
  })
    .png()
    .toFile(overlayPath);

  console.log(`transparentized (flood) ${path.relative(process.cwd(), overlayPath)}`);
}

async function composeOne(target) {
  const bgPath = path.join(ROOT, target.background);
  const overlayPath = path.join(ROOT, target.overlay);
  const outPath = path.join(ROOT, target.preview);

  if (!fs.existsSync(bgPath) || !fs.existsSync(overlayPath)) {
    throw new Error(`missing layer files for ${target.preview}`);
  }

  await ensureOverlayTransparent(overlayPath, target.innerSeed);

  const bgMeta = await sharp(bgPath).metadata();
  const width = bgMeta.width ?? 721;
  const height = bgMeta.height ?? 1024;

  const overlayForComposite = await sharp(overlayPath)
    .resize(width, height, { fit: "fill" })
    .ensureAlpha()
    .toBuffer();

  await sharp(bgPath)
    .composite([{ input: overlayForComposite, left: 0, top: 0 }])
    .png()
    .toFile(outPath);

  console.log(`wrote ${path.relative(process.cwd(), outPath)} (${width}x${height})`);
}

for (const target of TARGETS) {
  await composeOne(target);
}
