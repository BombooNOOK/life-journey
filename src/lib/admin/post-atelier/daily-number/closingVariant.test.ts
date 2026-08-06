import { describe, expect, it } from "vitest";

import {
  formatDailyNumberClosingVariantUsageLabel,
  pickRandomDailyNumberClosingVariant,
  resolveDailyNumberClosingVariant,
} from "./closingVariant";

describe("closingVariant", () => {
  it("lockedClosingVariant を優先する", () => {
    expect(
      resolveDailyNumberClosingVariant({ lockedClosingVariant: "animal_guides" }),
    ).toBe("animal_guides");
  });

  it("未指定時は4種のいずれかを返す", () => {
    const variant = resolveDailyNumberClosingVariant({ lockedClosingVariant: null });
    expect(["animal_friends", "diary_entry", "one_word_diary", "animal_guides"]).toContain(
      variant,
    );
  });

  it("ランダム抽選は4種のいずれか", () => {
    const variant = pickRandomDailyNumberClosingVariant();
    expect(["animal_friends", "diary_entry", "one_word_diary", "animal_guides"]).toContain(
      variant,
    );
  });

  it("使用ラベルを返す", () => {
    expect(formatDailyNumberClosingVariantUsageLabel("one_word_diary")).toBe(
      "ラストページ：ランダム（今回：ひとことあしあと）",
    );
  });
});
