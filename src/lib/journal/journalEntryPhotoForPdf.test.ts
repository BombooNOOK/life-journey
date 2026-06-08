import sharp from "sharp";
import { describe, expect, it } from "vitest";

import {
  isPdfSupportedImageMimeType,
  journalEntryPhotoPayloadToDataUriForPdf,
} from "./journalEntryPhotoForPdf";

describe("journalEntryPhotoForPdf", () => {
  it("keeps jpeg bytes as jpeg data uri", async () => {
    const jpeg = await sharp({
      create: { width: 2, height: 2, channels: 3, background: { r: 255, g: 0, b: 0 } },
    })
      .jpeg()
      .toBuffer();

    const uri = await journalEntryPhotoPayloadToDataUriForPdf({
      kind: "bytes",
      buffer: jpeg,
      mimeType: "image/jpeg",
    });

    expect(uri.startsWith("data:image/jpeg;base64,")).toBe(true);
  });

  it("keeps png bytes as png data uri", async () => {
    const png = await sharp({
      create: { width: 2, height: 2, channels: 3, background: { r: 0, g: 255, b: 0 } },
    })
      .png()
      .toBuffer();

    const uri = await journalEntryPhotoPayloadToDataUriForPdf({
      kind: "bytes",
      buffer: png,
      mimeType: "image/png",
    });

    expect(uri.startsWith("data:image/png;base64,")).toBe(true);
  });

  it("converts webp bytes to jpeg data uri for pdf", async () => {
    const webp = await sharp({
      create: { width: 2, height: 2, channels: 3, background: { r: 0, g: 0, b: 255 } },
    })
      .webp()
      .toBuffer();

    const uri = await journalEntryPhotoPayloadToDataUriForPdf({
      kind: "bytes",
      buffer: webp,
      mimeType: "image/webp",
    });

    expect(uri.startsWith("data:image/jpeg;base64,")).toBe(true);
    expect(isPdfSupportedImageMimeType("image/webp")).toBe(false);
  });

  it("converts legacy webp data url to jpeg data uri for pdf", async () => {
    const webp = await sharp({
      create: { width: 2, height: 2, channels: 3, background: { r: 10, g: 20, b: 30 } },
    })
      .webp()
      .toBuffer();

    const legacy = `data:image/webp;base64,${webp.toString("base64")}`;
    const uri = await journalEntryPhotoPayloadToDataUriForPdf({
      kind: "legacy_json",
      photoDataUrl: legacy,
    });

    expect(uri.startsWith("data:image/jpeg;base64,")).toBe(true);
  });
});
