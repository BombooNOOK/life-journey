import { describe, expect, it } from "vitest";

import { buildKanteiHallSummary } from "@/lib/kantei/kanteiHallSummary";
import type { NumerologyResult } from "@/lib/numerology/types";

const sample: NumerologyResult = {
  lifePathNumber: 1,
  destinyNumber: 2,
  soulNumber: 3,
  personalityNumber: 4,
  birthdayNumber: 5,
  bridges: {
    lifePathDestiny: 3,
    lifePathSoul: 4,
    lifePathPersonality: 5,
    birthdayLifePath: 6,
    destinySoul: 5,
    destinyPersonality: 6,
    destinyBirthday: 7,
    soulPersonality: 7,
    soulBirthday: 8,
    personalityBirthday: 9,
  },
};

describe("buildKanteiHallSummary", () => {
  it("builds core, maturity, and personal year rows with messages", () => {
    const summary = buildKanteiHallSummary({
      numerology: sample,
      birthMonth: 3,
      birthDay: 15,
      referenceDate: new Date("2026-07-13T00:00:00+09:00"),
    });

    expect(summary.coreRows).toHaveLength(5);
    expect(summary.coreRows[0]?.label).toBe("ライフパス");
    expect(summary.coreRows[0]?.value).toBe(1);
    expect(summary.coreRows[0]?.message.length).toBeGreaterThan(0);
    expect(summary.maturityRow.label).toBe("マチュリティ");
    expect(summary.maturityRow.value).toBeTypeOf("number");
    expect(summary.personalYearRow.yearLabel).toBe("2026年");
    expect(summary.personalYearRow.value).toBeTypeOf("number");
    expect(summary.personalYearRow.message.length).toBeGreaterThan(0);
  });
});
