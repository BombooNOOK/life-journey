import { describe, expect, it } from "vitest";

import {
  formatDailyNumberVariantUsageLabel,
  parseDailyNumberVariantMode,
  resolveDailyNumberCoverVariant,
} from "./variantMode";

describe("variantMode", () => {
  it("A/B/C はそのまま resolved になる", () => {
    expect(resolveDailyNumberCoverVariant({ variantMode: "A" })).toBe("A");
    expect(resolveDailyNumberCoverVariant({ variantMode: "B" })).toBe("B");
    expect(resolveDailyNumberCoverVariant({ variantMode: "C" })).toBe("C");
  });

  it("ランダムは lockedVariant を優先する", () => {
    expect(
      resolveDailyNumberCoverVariant({ variantMode: "random", lockedVariant: "B" }),
    ).toBe("B");
  });

  it("使用文体ラベルを返す", () => {
    expect(
      formatDailyNumberVariantUsageLabel({ variantMode: "B", variant: "B" }),
    ).toBe("使用文体：B 日常");
    expect(
      formatDailyNumberVariantUsageLabel({ variantMode: "random", variant: "C" }),
    ).toBe("使用文体：ランダム（今回：C 余韻）");
  });

  it("不正値は既定 A にフォールバック", () => {
    expect(parseDailyNumberVariantMode("")).toBe("A");
    expect(parseDailyNumberVariantMode("invalid")).toBe("A");
  });
});
