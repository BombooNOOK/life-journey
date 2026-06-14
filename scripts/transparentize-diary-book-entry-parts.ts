/**
 * 日記ブック entry パーツ PNG の白背景を透過化する。
 * 水彩風の端を残すため、しきい値付近はアルファをグラデーションさせる。
 */
import fs from "node:fs";
import path from "node:path";

import sharp from "sharp";

const PARTS_DIR = path.join(process.cwd(), "public/images/diary-book-entry");

/** この値以上の明るさを背景扱い（0–255） */
const WHITE_THRESHOLD = 242;
/** エッジのソフト幅（px） */
const SOFT_EDGE = 28;

function alphaForLuminance(lum: number): number {
  if (lum >= WHITE_THRESHOLD) return 0;
  if (lum <= WHITE_THRESHOLD - SOFT_EDGE) return 255;
  const t = (WHITE_THRESHOLD - lum) / SOFT_EDGE;
  return Math.round(Math.max(0, Math.min(1, t)) * 255);
}

/** キノコ（month）だけ水彩が青みがかって見えるため、暖色ベージュへ補正 */
async function warmTintMushroomIfNeeded(filePath: string, fileName: string): Promise<void> {
  if (fileName !== "diary-book-entry-number-bg-month.png") return;
  const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]!;
    if (a < 20) continue;
    data[i] = Math.min(255, Math.round(data[i]! * 1.14 + 18));
    data[i + 1] = Math.min(255, Math.round(data[i + 1]! * 1.1 + 12));
    data[i + 2] = Math.min(255, Math.round(data[i + 2]! * 0.9 + 6));
    // 全体をほんの少し濃くして左右のアイコンに馴染ませる
    data[i] = Math.min(255, Math.round(data[i]! * 0.9));
    data[i + 1] = Math.min(255, Math.round(data[i + 1]! * 0.9));
    data[i + 2] = Math.min(255, Math.round(data[i + 2]! * 0.9));
  }
  const tmp = `${filePath}.warm.tmp.png`;
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(tmp);
  fs.renameSync(tmp, filePath);
}

async function transparentizePng(filePath: string, fileName: string): Promise<void> {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const lum = (r + g + b) / 3;
    data[i + 3] = alphaForLuminance(lum);
  }

  const tmp = `${filePath}.tmp.png`;
  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(tmp);
  fs.renameSync(tmp, filePath);
  await warmTintMushroomIfNeeded(filePath, fileName);
}

async function main() {
  const files = fs
    .readdirSync(PARTS_DIR)
    .filter((name) => name.endsWith(".png") && !name.includes(".tmp"));

  for (const name of files) {
    const filePath = path.join(PARTS_DIR, name);
    await transparentizePng(filePath, name);
    const meta = await sharp(filePath).metadata();
    console.log(`OK ${name} (${meta.width}x${meta.height}, alpha)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
