import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { buildSvgTextOverlay } from "./svgText";
import { renderSvgOverlayToPng } from "./renderSvgOverlay";

async function firstInkY(png: Buffer): Promise<number> {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 4;
      if (data[i + 3]! > 20) return y;
    }
  }
  return -1;
}

describe("yOrigin=top raster alignment", () => {
  it.each([16, 18, 20, 22, 24, 36])("fontSize %s: ink top ≈ y", async (fontSize) => {
    const y = 150;
    const png = renderSvgOverlayToPng(
      buildSvgTextOverlay({
        width: 400,
        height: 400,
        items: [
          {
            text: "あA1",
            style: { x: 20, y, fontSize, fill: "#000", yOrigin: "top" },
          },
        ],
      }),
    );
    const ink = await firstInkY(png);
    expect(Math.abs(ink - y)).toBeLessThanOrEqual(2);
  });
});
