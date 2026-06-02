import { describe, expect, it } from "vitest";

import { estimateBodyLineClipsAtRightEdge } from "@/lib/journal/diaryPreviewStandardBodyMetrics";

describe("estimateBodyLineClipsAtRightEdge (relaxed)", () => {
  it("28 chars/line (current relaxed) fits within body region width estimate", () => {
    const at28 = estimateBodyLineClipsAtRightEdge("relaxed", 28);
    expect(at28.charsPerLine).toBe(28);
    expect(at28.likelyClips).toBe(false);
    expect(at28.estimatedLineWidthPx).toBeLessThanOrEqual(at28.bodyWidthPx + 0.5);
  });
});
