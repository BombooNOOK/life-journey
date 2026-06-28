import { describe, expect, it } from "vitest";

import {
  computeNormalizedPhotoCropFrame,
  computeSquarePhotoCropRect,
  DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST,
  journalSocialPostPhotoAdjustEquals,
  normalizeJournalSocialPostPhotoAdjust,
  parseJournalSocialPostPhotoAdjustFromSearchParams,
  buildPhotoCropSlotPreviewLayout,
} from "./photoAdjust";

describe("photoAdjust", () => {
  it("defaults invalid query values", () => {
    const params = new URLSearchParams("focusX=abc&focusY=2&scale=99");
    expect(parseJournalSocialPostPhotoAdjustFromSearchParams(params)).toEqual({
      focusX: 0.5,
      focusY: 1,
      scale: 3,
    });
  });

  it("scale=1 横長枠は正方形の中央帯を切り出す", () => {
    const rect = computeSquarePhotoCropRect({
      sourceWidth: 720,
      sourceHeight: 720,
      targetWidth: 733,
      targetHeight: 469,
      adjust: DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST,
    });
    expect(rect.left).toBe(0);
    expect(rect.width).toBe(720);
    expect(rect.height).toBeGreaterThan(450);
    expect(rect.height).toBeLessThan(470);
    expect(rect.top).toBeGreaterThan(120);
    expect(rect.top).toBeLessThan(140);
  });

  it("scale を上げると切り出しが小さくなる", () => {
    const base = computeSquarePhotoCropRect({
      sourceWidth: 720,
      sourceHeight: 720,
      targetWidth: 733,
      targetHeight: 469,
      adjust: { focusX: 0.5, focusY: 0.5, scale: 1 },
    });
    const zoomed = computeSquarePhotoCropRect({
      sourceWidth: 720,
      sourceHeight: 720,
      targetWidth: 733,
      targetHeight: 469,
      adjust: { focusX: 0.5, focusY: 0.5, scale: 2 },
    });
    expect(zoomed.width).toBeLessThan(base.width);
    expect(zoomed.height).toBeLessThan(base.height);
  });

  it("正規化枠は scale=1 で横長比率になる", () => {
    const frame = computeNormalizedPhotoCropFrame({
      targetWidth: 733,
      targetHeight: 469,
      adjust: DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST,
    });
    expect(frame.width).toBeCloseTo(1, 5);
    expect(frame.height).toBeCloseTo(469 / 733, 3);
    expect(frame.left).toBeCloseTo(0, 5);
  });

  it("非正方形ソースは中央の正方形から切り出す", () => {
    const rect = computeSquarePhotoCropRect({
      sourceWidth: 1024,
      sourceHeight: 472,
      targetWidth: 733,
      targetHeight: 469,
      adjust: DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST,
    });
    expect(rect.left).toBeGreaterThan(200);
    expect(rect.left + rect.width).toBeLessThan(824);
  });

  it("journalSocialPostPhotoAdjustEquals compares normalized values", () => {
    expect(
      journalSocialPostPhotoAdjustEquals(
        { focusX: 0.5, focusY: 0.5, scale: 1 },
        { focusX: 0.50001, focusY: 0.5, scale: 1 },
      ),
    ).toBe(true);
  });

  it("buildPhotoCropSlotPreviewLayout は正方形を潰さず配置する", () => {
    const frame = computeNormalizedPhotoCropFrame({
      targetWidth: 733,
      targetHeight: 469,
      adjust: { focusX: 0.5, focusY: 0.3, scale: 1 },
    });
    const layout = buildPhotoCropSlotPreviewLayout({
      sourceWidth: 720,
      sourceHeight: 720,
      squareFrame: frame,
      containerWidth: 320,
    });
    expect(layout.displayWidth).toBeCloseTo(320, 5);
    expect(Number.isFinite(layout.left)).toBe(true);
    expect(Number.isFinite(layout.top)).toBe(true);
  });
});
