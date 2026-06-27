import fs from "node:fs";
import path from "node:path";

import sharp from "sharp";

import { isCompanionType, type CompanionType } from "@/lib/journal/meta";

import type { JournalSocialPostCompanionFaceStyle } from "./templates";

const FACE_DIR = path.join(process.cwd(), "public/decorations/characters");

const COMPANION_FACE_FILES: Record<CompanionType, string> = {
  owl: "owl-face.png",
  sloth: "sloth-face.png",
  squirrel: "squirrel-face.png",
  hedgehog: "hedgehog-face.png",
  frog: "kero-face.png",
};

/** CharacterFaceIcon と同じトリミング感 */
const FACE_TUNING: Record<CompanionType, { centerYRatio: number; scale: number }> = {
  owl: { centerYRatio: 0.48, scale: 1.08 },
  sloth: { centerYRatio: 0.44, scale: 1.14 },
  squirrel: { centerYRatio: 0.36, scale: 1.1 },
  hedgehog: { centerYRatio: 0.42, scale: 1.02 },
  frog: { centerYRatio: 0.4, scale: 1.12 },
};

export function companionFaceCompositePosition(style: JournalSocialPostCompanionFaceStyle): {
  left: number;
  top: number;
} {
  const anchor = style.textAnchor ?? "middle";
  if (anchor === "middle") {
    return {
      left: Math.round(style.x - style.sizePx / 2),
      top: Math.round(style.y - style.sizePx / 2),
    };
  }
  return { left: style.x, top: style.y };
}

export async function buildCompanionFaceLayer(
  companionType: string,
  style: JournalSocialPostCompanionFaceStyle,
): Promise<Buffer | null> {
  const type = isCompanionType(companionType) ? companionType : "owl";
  const filePath = path.join(FACE_DIR, COMPANION_FACE_FILES[type]);
  if (!fs.existsSync(filePath)) return null;

  const tuning = FACE_TUNING[type];
  const sourceMeta = await sharp(filePath).metadata();
  const sourceSize = sourceMeta.width ?? 1024;
  const cropSize = Math.min(sourceSize, Math.round(sourceSize / tuning.scale));
  const cx = sourceSize * 0.5;
  const cy = sourceSize * tuning.centerYRatio;
  const left = Math.max(0, Math.round(cx - cropSize / 2));
  const top = Math.max(0, Math.round(cy - cropSize / 2));
  const extractWidth = Math.min(cropSize, sourceSize - left);
  const extractHeight = Math.min(cropSize, sourceSize - top);
  const size = style.sizePx;

  const face = await sharp(filePath)
    .extract({ left, top, width: extractWidth, height: extractHeight })
    .resize(size, size, { fit: "cover" })
    .png()
    .toBuffer();

  const circleMask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/>
    </svg>`,
  );

  return sharp(face)
    .ensureAlpha()
    .composite([{ input: circleMask, blend: "dest-in" }])
    .png()
    .toBuffer();
}
