import path from "node:path";

import { Resvg } from "@resvg/resvg-js";

const DAILY_NUMBER_KLEE_FONT_FILES = [
  path.join(process.cwd(), "src/components/pdf/assets/fonts/KleeOne-Regular.ttf"),
  path.join(process.cwd(), "src/components/pdf/assets/fonts/KleeOne-SemiBold.ttf"),
] as const;

export function isSvgBuffer(buffer: Buffer): boolean {
  const head = buffer.subarray(0, 200).toString("utf8").trimStart();
  return head.startsWith("<?xml") || head.startsWith("<svg");
}

/** sharp（librsvg）は SVG 内の日本語 @font-face を描画できないため resvg でラスタライズする */
export function renderSvgOverlayToPng(svgBuffer: Buffer): Buffer {
  const resvg = new Resvg(svgBuffer.toString("utf8"), {
    font: {
      fontFiles: [...DAILY_NUMBER_KLEE_FONT_FILES],
      defaultFontFamily: "DailyNumberKlee",
      loadSystemFonts: false,
    },
  });
  return Buffer.from(resvg.render().asPng());
}

export async function prepareCompositeOverlay(overlay: Buffer): Promise<Buffer> {
  if (isSvgBuffer(overlay)) {
    return renderSvgOverlayToPng(overlay);
  }
  return overlay;
}
