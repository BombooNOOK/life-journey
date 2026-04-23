import { describe, expect, it } from "vitest";

import { expectedFromVerifyFields } from "./verifyInput";

describe("expectedFromVerifyFields", () => {
  it("空欄は比較対象に含めない", () => {
    expect(expectedFromVerifyFields({ oldLp: "", oldD: "", oldS: "", oldP: "", oldBd: "" })).toEqual({});
  });

  it("数値を解釈し D/S/P は null を許可", () => {
    const e = expectedFromVerifyFields({
      oldLp: "11",
      oldD: "-",
      oldS: "6",
      oldP: "null",
      oldBd: "6",
    });
    expect(e.lifePathNumber).toBe(11);
    expect(e.destinyNumber).toBeNull();
    expect(e.soulNumber).toBe(6);
    expect(e.personalityNumber).toBeNull();
    expect(e.birthdayNumber).toBe(6);
  });
});
