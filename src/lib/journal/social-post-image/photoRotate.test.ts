import { describe, expect, it } from "vitest";
import sharp from "sharp";

import {
  computeSharpRotateTopLeftLayerOffset,
  journalSocialPostPhotoCompositePosition,
  rotatePhotoLayerAroundTopLeft,
} from "./photoRotate";

describe("photoRotate", () => {
  it("sharp.rotate 後の元左上オフセット", () => {
    expect(computeSharpRotateTopLeftLayerOffset(400, 400, 0)).toEqual({
      layerLeft: 0,
      layerTop: 0,
      width: 400,
      height: 400,
    });
    const cw = computeSharpRotateTopLeftLayerOffset(400, 400, 10);
    expect(cw.layerLeft).toBeCloseTo(69, 0);
    expect(cw.layerTop).toBe(0);
    expect(cw.width).toBeGreaterThanOrEqual(463);
    const ccwOffset = computeSharpRotateTopLeftLayerOffset(400, 400, -10);
    expect(ccwOffset.layerLeft).toBe(0);
    expect(ccwOffset.layerTop).toBeCloseTo(69, 0);
    expect(ccwOffset.width).toBeGreaterThanOrEqual(463);
  });

  it("合成位置は回転後もスロット左上を軸にする", () => {
    expect(journalSocialPostPhotoCompositePosition({ x: 68, y: 302, width: 400, height: 400 }, 0)).toEqual({
      left: 68,
      top: 302,
    });
    const ccw = journalSocialPostPhotoCompositePosition({ x: 68, y: 302, width: 400, height: 400 }, -10);
    expect(ccw.left).toBe(68);
    expect(ccw.top).toBe(233);
    const cw = journalSocialPostPhotoCompositePosition({ x: 68, y: 302, width: 400, height: 400 }, 10);
    expect(cw.left).toBe(-1);
    expect(cw.top).toBe(302);
  });

  it("rotatePhotoLayerAroundTopLeft は矩形を保ったまま回転する", async () => {
    const base = await sharp({
      create: { width: 400, height: 400, channels: 4, background: { r: 200, g: 180, b: 160, alpha: 1 } },
    })
      .composite([
        {
          input: await sharp({
            create: { width: 3, height: 3, channels: 4, background: { r: 0, g: 255, b: 0, alpha: 1 } },
          })
            .png()
            .toBuffer(),
          left: 0,
          top: 0,
        },
      ])
      .png()
      .toBuffer();

    const rotated = await rotatePhotoLayerAroundTopLeft(base, 400, 400, -10);
    const meta = await sharp(rotated).metadata();
    expect(meta.width).toBeGreaterThanOrEqual(463);
    expect(meta.height).toBeGreaterThanOrEqual(463);

    const { data, info } = await sharp(rotated).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let green: { x: number; y: number } | null = null;
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        const i = (y * info.width + x) * 4;
        if (data[i + 1]! > 200 && data[i]! < 50) {
          green = { x, y };
          break;
        }
      }
      if (green) break;
    }
    expect(green).toMatchObject({ x: 0, y: 68 });

    const pos = journalSocialPostPhotoCompositePosition({ x: 68, y: 302, width: 400, height: 400 }, -10);
    expect(Math.abs(pos.left + (green?.x ?? 0) - 68)).toBeLessThanOrEqual(1);
    expect(Math.abs(pos.top + (green?.y ?? 0) - 302)).toBeLessThanOrEqual(1);
  });
});
