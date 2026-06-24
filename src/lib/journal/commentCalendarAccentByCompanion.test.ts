import { describe, expect, it } from "vitest";

import { generateDiaryReading } from "@/lib/diary-reading/generateDiaryReading";
import { getCompanionAccentText } from "@/lib/journal/commentCalendarAccentByCompanion";

describe("getCompanionAccentText", () => {
  it("owl は本番原稿を返す", () => {
    const text = getCompanionAccentText("calendar_month_1_1", "owl");
    expect(text).toContain("小さく始めたこと");
  });

  it("hedgehog は pending 原稿があれば owl と異なる", () => {
    const owl = getCompanionAccentText("calendar_month_1_1", "owl");
    const hedgehog = getCompanionAccentText("calendar_month_1_1", "hedgehog");
    expect(hedgehog).not.toBe(owl);
    expect(hedgehog).toContain("案外役立つ");
  });

  it("pending にないアクセントは owl にフォールバックする", () => {
    const owl = getCompanionAccentText("unknown_accent_1", "owl");
    const sloth = getCompanionAccentText("unknown_accent_1", "sloth");
    expect(sloth).toBe(owl);
    expect(sloth).toBe("");
  });
});

describe("generateDiaryReading アクセント", () => {
  it("暦の月アクセントもキャラで切り替わる", () => {
    const input = {
      actionCategory: "ordinary_record" as const,
      mood: "calm" as const,
      personalYear: 1 as const,
      personalMonth: 1 as const,
      personalDay: 1 as const,
      calendarMonth: 6,
      calendarDay: 14,
    };
    const owl = generateDiaryReading({ ...input, companionType: "owl" });
    const hedgehog = generateDiaryReading({ ...input, companionType: "hedgehog" });
    expect(hedgehog.text).not.toBe(owl.text);
    expect(hedgehog.usedTemplateIds.some((id) => id.startsWith("calendar_month_"))).toBe(true);
    expect(hedgehog.text).toMatch(/今月|まわり|関係|あたたか/);
  });
});
