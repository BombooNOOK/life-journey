import { describe, expect, it } from "vitest";

import { estimateBodyLineClipsAtRightEdge } from "@/lib/journal/diaryPreviewStandardBodyMetrics";

describe("estimateBodyLineClipsAtRightEdge (standard)", () => {
  it("32 chars/line (current standard) fits within body region width estimate", () => {
    const at32 = estimateBodyLineClipsAtRightEdge("standard", 32);
    expect(at32.charsPerLine).toBe(32);
    expect(at32.likelyClips).toBe(false);
    expect(at32.estimatedLineWidthPx).toBeLessThanOrEqual(at32.bodyWidthPx + 0.5);
  });

  it("41 chars/line exceeds body region width at same font size", () => {
    const at41 = estimateBodyLineClipsAtRightEdge("standard", 41);
    expect(at41.likelyClips).toBe(true);
    expect(at41.estimatedLineWidthPx).toBeGreaterThan(at41.bodyWidthPx);
  });
});

describe("estimateBodyLineClipsAtRightEdge (generous)", () => {
  it("40 chars/line (current generous) fits within body region width estimate", () => {
    const at40 = estimateBodyLineClipsAtRightEdge("generous", 40);
    expect(at40.charsPerLine).toBe(40);
    expect(at40.likelyClips).toBe(false);
    expect(at40.estimatedLineWidthPx).toBeLessThanOrEqual(at40.bodyWidthPx + 0.5);
  });
});
