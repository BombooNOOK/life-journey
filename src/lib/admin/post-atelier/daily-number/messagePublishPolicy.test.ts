import { describe, expect, it } from "vitest";

import {
  formatDailyNumberMessageFallbackNotice,
  getDailyNumberMessageSource,
  hasExactDailyNumberMessages,
  isDailyNumberPublishReady,
} from "./messagePublishPolicy";

describe("messagePublishPolicy", () => {
  it("フクロウ先生は exact", () => {
    expect(
      getDailyNumberMessageSource({
        todayNumber: 8,
        character: "owl",
        messageType: "base",
        variantMode: "A",
      }),
    ).toBe("exact");
    expect(
      isDailyNumberPublishReady({
        todayNumber: 8,
        character: "owl",
        messageType: "base",
        variantMode: "A",
      }),
    ).toBe(true);
  });

  it("ケロシオンは preview 可・publish 不可", () => {
    expect(
      getDailyNumberMessageSource({
        todayNumber: 8,
        character: "frog",
        messageType: "base",
        variantMode: "A",
      }),
    ).toBe("fallback_owl");
    expect(
      hasExactDailyNumberMessages({
        todayNumber: 8,
        character: "frog",
        messageType: "base",
        variant: "A",
      }),
    ).toBe(false);
    expect(
      isDailyNumberPublishReady({
        todayNumber: 8,
        character: "frog",
        messageType: "base",
        variantMode: "A",
      }),
    ).toBe(false);
  });

  it("フォールバック通知文にキャラ名を含む", () => {
    expect(formatDailyNumberMessageFallbackNotice("frog")).toContain("ケロシオン");
    expect(formatDailyNumberMessageFallbackNotice("frog")).toContain("フクロウ先生");
  });
});
