import { describe, expect, it } from "vitest";

import { bindingBackgroundImageSrc } from "./pdfBindingBackground";
import {
  PDF_BACK_COVER_PATH,
  PDF_SPREAD_LEFT_PATH,
  PDF_SPREAD_RIGHT_PATH,
} from "./pdfAssetPaths";

describe("bindingBackgroundImageSrc", () => {
  it("1P は背景なし", () => {
    expect(bindingBackgroundImageSrc(1, 10)).toBeNull();
  });

  it("2P は独立ページとして背景なし（total>2）", () => {
    expect(bindingBackgroundImageSrc(2, 5)).toBeNull();
  });

  it("2P かつ最終のみ2枚のときは裏表紙", () => {
    expect(bindingBackgroundImageSrc(2, 2)).toBe(PDF_BACK_COVER_PATH);
  });

  it("3P以降は奇左・偶右（最終以外）", () => {
    expect(bindingBackgroundImageSrc(3, 6)).toBe(PDF_SPREAD_LEFT_PATH);
    expect(bindingBackgroundImageSrc(4, 6)).toBe(PDF_SPREAD_RIGHT_PATH);
    expect(bindingBackgroundImageSrc(5, 6)).toBe(PDF_SPREAD_LEFT_PATH);
  });

  it("最終ページは裏表紙", () => {
    expect(bindingBackgroundImageSrc(6, 6)).toBe(PDF_BACK_COVER_PATH);
  });
});
