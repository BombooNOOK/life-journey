import { describe, expect, it } from "vitest";

import { buildBridgeNumbersFromCore } from "@/lib/numerology/compute";
import { selectStones } from "./select";
import {
  numerologyCoreEqualForStones,
  recalculateStonesFromNumerology,
  stoneDriftHints,
} from "./fromNumerology";
import type { NumerologyResult } from "@/lib/numerology/types";

const baseN: NumerologyResult = {
  lifePathNumber: 3,
  destinyNumber: 5,
  soulNumber: 1,
  personalityNumber: 8,
  birthdayNumber: 6,
  bridges: buildBridgeNumbersFromCore({
    lifePath: 3,
    destiny: 5,
    soul: 1,
    personality: 8,
    birthday: 6,
  }),
};

describe("fromNumerology", () => {
  it("recalculateStonesFromNumerology は selectStones と同じ結果", () => {
    expect(recalculateStonesFromNumerology(baseN)).toEqual(selectStones(baseN));
  });

  it("numerologyCoreEqualForStones", () => {
    expect(numerologyCoreEqualForStones(baseN, { ...baseN, lifePathNumber: 4 })).toBe(false);
    expect(numerologyCoreEqualForStones(baseN, { ...baseN })).toBe(true);
  });

  it("stoneDriftHints が LP 差分でヒントを返す", () => {
    const current = { ...baseN, lifePathNumber: 9 };
    const stonesStored = selectStones(baseN);
    const stonesRecalculated = selectStones(current);
    const hints = stoneDriftHints({
      numerologyAtSave: baseN,
      numerologyCurrent: current,
      stonesStored,
      stonesRecalculated,
    });
    expect(hints.some((h) => h.includes("ライフ・パス"))).toBe(true);
  });
});
