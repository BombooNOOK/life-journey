import { describe, expect, it } from "vitest";

import {
  formatSocialPostDateRibbonParts,
  formatSocialPostDateScrapbook,
} from "./dateFormat";

describe("formatSocialPostDateRibbonParts", () => {
  it("年と月.日を返す", () => {
    expect(formatSocialPostDateRibbonParts(new Date("2026-06-19T00:00:00.000Z"))).toEqual({
      year: "2026",
      monthDay: "6.19",
    });
  });
});

describe("formatSocialPostDateScrapbook", () => {
  it("2026.6.19 (金) 形式", () => {
    const label = formatSocialPostDateScrapbook(new Date("2026-06-19T00:00:00.000Z"));
    expect(label).toContain("2026");
    expect(label).toContain("6");
    expect(label).toContain("19");
    expect(label).toMatch(/\(.\)/);
  });
});
