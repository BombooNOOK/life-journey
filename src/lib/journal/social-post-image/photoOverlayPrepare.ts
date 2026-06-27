import sharp from "sharp";

/** Canva 書き出しで白背景 JPEG になった場合の救済（付箋以外を透明化） */
const NEAR_WHITE_THRESHOLD = 245;

export async function prepareJournalSocialPostPhotoOverlay(input: Buffer): Promise<Buffer> {
  const meta = await sharp(input).metadata();
  if (meta.hasAlpha) {
    return input;
  }

  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    if (r >= NEAR_WHITE_THRESHOLD && g >= NEAR_WHITE_THRESHOLD && b >= NEAR_WHITE_THRESHOLD) {
      data[i + 3] = 0;
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}
