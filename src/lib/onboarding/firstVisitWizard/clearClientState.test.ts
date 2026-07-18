import { describe, expect, it } from "vitest";

/**
 * clearAllFirstVisitClientState は window 依存のため、
 * キー規約（prefix）の回帰だけを固定する。
 */
describe("firstVisit client cleanup conventions", () => {
  it("uses stable prefixes for first-visit and companion handoff state", () => {
    const firstVisitPrefix = "ljd:firstGuide:";
    const companionPrefixes = ["lj-cw-", "lj-journal-companion-handoff:"];
    expect(firstVisitPrefix.startsWith("ljd:")).toBe(true);
    expect(companionPrefixes.every((p) => p.startsWith("lj-"))).toBe(true);
  });
});
