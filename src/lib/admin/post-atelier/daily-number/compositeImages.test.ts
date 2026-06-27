import { describe, expect, it } from "vitest";

import { buildDailyNumberZipBuffer, compositeDailyNumberCarousel } from "./compositeImages";
import { resolveDailyNumberPost } from "./resolveDailyNumberPost";
import { dailyNumberZipBasename } from "./zipBasename";
import { resolveDailyNumberPost } from "./resolveDailyNumberPost";
import { DAILY_NUMBER_TEMPLATE_SIZE } from "./assetPaths";

describe("compositeDailyNumberCarousel", () => {
  it("generates 9 slides including closing for UD8 owl payload", async () => {
    const resolved = resolveDailyNumberPost({
      scheduledDate: "2026-06-19",
      todayNumber: 8,
      character: "owl",
      messageType: "base",
      lockedClosingVariant: "diary_entry",
    });
    if (!resolved.ok) throw new Error("expected ok");

    const slides = await compositeDailyNumberCarousel(resolved.payload);
    expect(slides).toHaveLength(9);
    expect(slides[0]?.filename).toBe("01-cover.png");
    expect(slides[1]?.filename).toBe("02-explain.png");
    expect(slides[7]?.filename).toBe("08-personal-page_06.png");
    expect(slides[8]?.filename).toBe("09-closing-diary_entry.png");
    expect(resolved.payload.closingVariant).toBe("diary_entry");

    for (const slide of slides) {
      expect(slide.buffer.byteLength).toBeGreaterThan(10_000);
      expect(slide.buffer.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    }
  });

  it("output matches template dimensions", async () => {
    const resolved = resolveDailyNumberPost({
      scheduledDate: "2026-06-19",
      todayNumber: 8,
      character: "owl",
      messageType: "base",
    });
    if (!resolved.ok) throw new Error("expected ok");

    const slides = await compositeDailyNumberCarousel(resolved.payload);
    const sharp = (await import("sharp")).default;
    const meta = await sharp(slides[0]!.buffer).metadata();
    expect(meta.width).toBe(DAILY_NUMBER_TEMPLATE_SIZE.widthPx);
    expect(meta.height).toBe(DAILY_NUMBER_TEMPLATE_SIZE.heightPx);
  });

  it("ZIP に instagram-caption.txt を含む", async () => {
    const resolved = resolveDailyNumberPost({
      scheduledDate: "2026-06-19",
      todayNumber: 8,
      character: "owl",
      messageType: "base",
    });
    if (!resolved.ok) throw new Error("expected ok");

    const { buffer } = await buildDailyNumberZipBuffer(resolved.payload);
    const { unzipSync } = await import("fflate");
    const files = unzipSync(new Uint8Array(buffer));
    const captionBytes = files["instagram-caption.txt"];
    expect(captionBytes).toBeDefined();

    const caption = new TextDecoder().decode(captionBytes!);
    expect(caption).toContain("あなたのすうじで読む");
    expect(caption).toContain("#BambooNOOK");
    expect(caption).toContain("【すうじ1のあなたへ】");
    expect(caption).toContain("プロフィール欄のリンクから");
  });
});
