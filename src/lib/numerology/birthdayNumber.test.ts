import { describe, expect, it } from "vitest";

import { birthdayNumberFromBirthDate } from "./compute";

describe("birthdayNumberFromBirthDate（楽天仕様: 日のみ・11/22はマスター）", () => {
  it("2008-08-11 → 11", () => {
    expect(birthdayNumberFromBirthDate({ year: 2008, month: 8, day: 11 })).toBe(11);
  });

  it("22日生まれ → 22", () => {
    expect(birthdayNumberFromBirthDate({ year: 1990, month: 5, day: 22 })).toBe(22);
  });

  it("28日 → 2+8=10 → 1", () => {
    expect(birthdayNumberFromBirthDate({ year: 2000, month: 1, day: 28 })).toBe(1);
  });

  it("15日 → 1+5=6", () => {
    expect(birthdayNumberFromBirthDate({ year: 2000, month: 1, day: 15 })).toBe(6);
  });

  it("29日: 2+9=11 は日付が11日ではないのでさらに縮約して 2", () => {
    expect(birthdayNumberFromBirthDate({ year: 2000, month: 1, day: 29 })).toBe(2);
  });

  it("従来の 11日: 桁和2になっていたが 11 になる", () => {
    expect(birthdayNumberFromBirthDate({ year: 1988, month: 6, day: 11 })).toBe(11);
  });
});
