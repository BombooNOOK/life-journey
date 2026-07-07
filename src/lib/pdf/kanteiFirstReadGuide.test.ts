import { describe, expect, it } from "vitest";

import {
  buildKanteiFirstReadHref,
  isKanteiFirstReadGuideMode,
  isPdfIndexInFirstReadRange,
  kanteiLifePathFirstPdfIndex,
  kanteiLifePathLastPdfIndex,
} from "@/lib/pdf/kanteiFirstReadGuide";

describe("kanteiFirstReadGuide", () => {
  it("builds first-read href", () => {
    expect(buildKanteiFirstReadHref("ord-1")).toBe("/orders/ord-1/read?guide=life-path-first");
  });

  it("detects guide mode", () => {
    expect(isKanteiFirstReadGuideMode("life-path-first")).toBe(true);
    expect(isKanteiFirstReadGuideMode("other")).toBe(false);
  });

  it("defines life path page range", () => {
    expect(kanteiLifePathFirstPdfIndex()).toBe(8);
    expect(kanteiLifePathLastPdfIndex()).toBe(15);
    expect(isPdfIndexInFirstReadRange(8)).toBe(true);
    expect(isPdfIndexInFirstReadRange(15)).toBe(true);
    expect(isPdfIndexInFirstReadRange(16)).toBe(false);
    expect(isPdfIndexInFirstReadRange(7)).toBe(false);
  });
});
