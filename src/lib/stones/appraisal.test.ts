import { describe, expect, it } from "vitest";

import { buildBridgeNumbersFromCore } from "@/lib/numerology/compute";

import { selectAppraisalStones } from "./appraisal";

describe("selectAppraisalStones", () => {
  it("5コア分の石情報を返す", () => {
    const result = selectAppraisalStones({
      lifePathNumber: 1,
      destinyNumber: 11,
      soulNumber: 6,
      personalityNumber: 7,
      birthdayNumber: 22,
      bridges: buildBridgeNumbersFromCore({
        lifePath: 1,
        destiny: 11,
        soul: 6,
        personality: 7,
        birthday: 22,
      }),
    });
    expect(result.items).toHaveLength(5);
    expect(result.items.map((i) => i.label)).toEqual(["LP", "D", "S", "P", "BD"]);
  });

  it("番号に対応する色を返す", () => {
    const result = selectAppraisalStones({
      lifePathNumber: 33,
      destinyNumber: 22,
      soulNumber: 11,
      personalityNumber: 9,
      birthdayNumber: 8,
      bridges: buildBridgeNumbersFromCore({
        lifePath: 33,
        destiny: 22,
        soul: 11,
        personality: 9,
        birthday: 8,
      }),
    });
    const byLabel = Object.fromEntries(result.items.map((i) => [i.label, i.color]));
    expect(byLabel.LP).toBe("虹");
    expect(byLabel.D).toBe("ゴールド");
    expect(byLabel.S).toBe("シルバー");
    expect(byLabel.P).toBe("紫");
    expect(byLabel.BD).toBe("橙・茶");
  });
});
