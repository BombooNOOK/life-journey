import { describe, expect, it } from "vitest";

import {
  DEVICE_MOVIE_BASIC_CANVAS_APPLE,
  DEVICE_MOVIE_BASIC_CANVAS_DESKTOP,
  DEVICE_MOVIE_BASIC_LAYOUT_NORM,
  DEVICE_MOVIE_BASIC_VIDEO_EDGE_PAD_DESIGN_PX,
  DEVICE_MOVIE_DECORATION_FALLBACK,
  formatDeviceMovieDisplayDate,
  insetDeviceMovieRoundedRect,
  pickDeviceMovieDecorationVariant,
  resolveDeviceMovieBasicCanvasSize,
  resolveDeviceMovieCoverDraw,
  resolveDeviceMovieDecorationVariant,
  scaleDeviceMovieBasicLayout,
} from "@/lib/journal/moriLog/deviceMovieBasicTemplate";

describe("deviceMovieBasicTemplate", () => {
  it("keeps 4:5 canvas for desktop and apple", () => {
    const desk = resolveDeviceMovieBasicCanvasSize({ appleMobile: false });
    const apple = resolveDeviceMovieBasicCanvasSize({ appleMobile: true });
    expect(desk).toEqual(DEVICE_MOVIE_BASIC_CANVAS_DESKTOP);
    expect(apple).toEqual(DEVICE_MOVIE_BASIC_CANVAS_APPLE);
    expect(desk.width / desk.height).toBeCloseTo(4 / 5, 5);
    expect(apple.width / apple.height).toBeCloseTo(4 / 5, 5);
    expect(apple.width % 16).toBe(0);
    expect(apple.height % 16).toBe(0);
  });

  it("scales layout to canvas pixels", () => {
    const layout = scaleDeviceMovieBasicLayout(1080, 1350);
    expect(layout.canvasWidth).toBe(1080);
    expect(layout.videoRect.width).toBeGreaterThan(900);
    expect(layout.videoRect.height).toBeGreaterThan(900);
    expect(layout.videoRect.borderRadius).toBeGreaterThan(50);
    expect(layout.text.left).toBeGreaterThan(layout.titleRect.x);
  });

  it("insets video clip and enables kinari matte by default", () => {
    const layout = scaleDeviceMovieBasicLayout(1080, 1350);
    const expectedPad = Math.round(
      (DEVICE_MOVIE_BASIC_VIDEO_EDGE_PAD_DESIGN_PX * 1080) /
        DEVICE_MOVIE_BASIC_LAYOUT_NORM.designWidth,
    );
    expect(expectedPad).toBeGreaterThanOrEqual(4);
    expect(expectedPad).toBeLessThanOrEqual(8);
    expect(layout.videoMatte.widthPx).toBe(expectedPad);
    expect(layout.videoClipRect.x).toBe(layout.videoRect.x + expectedPad);
    expect(layout.videoClipRect.y).toBe(layout.videoRect.y + expectedPad);
    expect(layout.videoClipRect.width).toBe(layout.videoRect.width - expectedPad * 2);
    expect(layout.videoClipRect.height).toBe(layout.videoRect.height - expectedPad * 2);
    expect(layout.videoClipRect.borderRadius).toBe(
      Math.max(0, layout.videoRect.borderRadius - expectedPad),
    );
  });

  it("allows edge pad 0 for true transparent overlay swap", () => {
    const layout = scaleDeviceMovieBasicLayout(1080, 1350, { edgePadDesignPx: 0 });
    expect(layout.videoMatte.widthPx).toBe(0);
    expect(layout.videoClipRect).toEqual(layout.videoRect);
    expect(insetDeviceMovieRoundedRect(layout.videoRect, 0)).toEqual(layout.videoRect);
  });

  it("covers landscape video by cutting left/right (center)", () => {
    const frame = { frameWidth: 700, frameHeight: 900 };
    const draw = resolveDeviceMovieCoverDraw({
      ...frame,
      sourceWidth: 1920,
      sourceHeight: 1080,
      focusX: 0.5,
      focusY: 0.5,
      scale: 1,
    });
    expect(draw.dh).toBeCloseTo(frame.frameHeight, 5);
    expect(draw.dw).toBeGreaterThan(frame.frameWidth);
    expect(draw.dy).toBeCloseTo(0, 5);
    expect(draw.dx).toBeLessThan(0);
    expect(draw.dx + draw.dw).toBeGreaterThan(frame.frameWidth);
  });

  it("covers portrait video by cutting top/bottom (center)", () => {
    const frame = { frameWidth: 700, frameHeight: 900 };
    const draw = resolveDeviceMovieCoverDraw({
      ...frame,
      sourceWidth: 1080,
      sourceHeight: 1920,
      focusX: 0.5,
      focusY: 0.5,
      scale: 1,
    });
    expect(draw.dw).toBeCloseTo(frame.frameWidth, 5);
    expect(draw.dh).toBeGreaterThan(frame.frameHeight);
    expect(draw.dx).toBeCloseTo(0, 5);
    expect(draw.dy).toBeLessThan(0);
  });

  it("covers square video without letterbox", () => {
    const frame = { frameWidth: 700, frameHeight: 900 };
    const draw = resolveDeviceMovieCoverDraw({
      ...frame,
      sourceWidth: 1000,
      sourceHeight: 1000,
      focusX: 0.5,
      focusY: 0.5,
      scale: 1,
    });
    // 正方形→縦長枠: 高さ合わせで左右を中央クロップ
    expect(draw.dh).toBeCloseTo(frame.frameHeight, 5);
    expect(draw.dw).toBeGreaterThan(frame.frameWidth);
    expect(draw.dy).toBeCloseTo(0, 5);
    expect(draw.dx).toBeLessThan(0);
  });

  it("fixes decoration random and falls back to lantern", () => {
    expect(resolveDeviceMovieDecorationVariant(undefined)).toBe(
      DEVICE_MOVIE_DECORATION_FALLBACK,
    );
    expect(resolveDeviceMovieDecorationVariant("owl")).toBe("owl");
    const picks = new Set<string>();
    for (let i = 0; i < 30; i++) {
      picks.add(pickDeviceMovieDecorationVariant(() => i / 30));
    }
    expect(picks.has("lantern")).toBe(true);
    expect(picks.has("owl")).toBe(true);
    expect(picks.has("quill")).toBe(true);
    // same seed → same pick
    expect(pickDeviceMovieDecorationVariant(() => 0.1)).toBe(
      pickDeviceMovieDecorationVariant(() => 0.1),
    );
  });

  it("formats display date", () => {
    expect(formatDeviceMovieDisplayDate("2026-08-06")).toBe("2026.08.06");
  });
});
