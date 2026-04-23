import { describe, expect, it } from "vitest";

import { buildBridgeScoreCommentsDump } from "./buildBridgeScoreCommentsDump";

describe("buildBridgeScoreCommentsDump", () => {
  it("includes reference tables and pairKey lines", () => {
    const text = buildBridgeScoreCommentsDump();
    expect(text.length).toBeGreaterThan(500);
    expect(text).toContain("LP×D（ライフパス × ディスティニー）");
    expect(text).toContain("P×BD（パーソナリティ × バースデー）");
    expect(text).toContain("〈00〉");
    expect(text).toContain("bridgeProfiles.scoreLabel");
    expect(text).toMatch(/〈\d{2}〉 bridgeNumber=/);
  });
});
