import { describe, expect, it } from "vitest";

import { buildSvgTextOverlay } from "./svgText";
import { isSvgBuffer, renderSvgOverlayToPng } from "./renderSvgOverlay";

describe("renderSvgOverlay", () => {
  it("日本語 SVG を PNG にラスタライズする", () => {
    const svg = buildSvgTextOverlay({
      width: 200,
      height: 100,
      items: [
        {
          text: "今日のこころ予報",
          style: { x: 10, y: 50, fontSize: 22 },
        },
      ],
    });

    expect(isSvgBuffer(svg)).toBe(true);
    const png = renderSvgOverlayToPng(svg);
    expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect(png.byteLength).toBeGreaterThan(1000);
  });
});
