import { describe, expect, it } from "vitest";

import { compareCoreFive } from "./coreFive";

describe("compareCoreFive", () => {
  it("期待値がある項目だけ比較する", () => {
    const actual = {
      lifePathNumber: 3,
      destinyNumber: 5,
      soulNumber: 1,
      personalityNumber: 4,
      birthdayNumber: 9,
    };
    const { rows, allComparedMatch } = compareCoreFive(actual, { lifePathNumber: 3, birthdayNumber: 8 });
    expect(allComparedMatch).toBe(false);
    const lp = rows.find((r) => r.key === "lifePathNumber");
    const bd = rows.find((r) => r.key === "birthdayNumber");
    const dest = rows.find((r) => r.key === "destinyNumber");
    expect(lp?.status).toBe("match");
    expect(bd?.status).toBe("mismatch");
    expect(dest?.status).toBe("skipped");
  });

  it("null 期待を比較できる", () => {
    const actual = {
      lifePathNumber: 1,
      destinyNumber: null,
      soulNumber: 2,
      personalityNumber: null,
      birthdayNumber: 3,
    };
    const { allComparedMatch } = compareCoreFive(actual, {
      destinyNumber: null,
      personalityNumber: null,
    });
    expect(allComparedMatch).toBe(true);
  });
});
