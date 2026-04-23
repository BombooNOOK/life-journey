import { describe, expect, it } from "vitest";

import { parseOrderBirthDateParts } from "./birthDate";
import {
  normalizeNumerologyResult,
  numerologyWithRefreshedLifePath,
} from "./numerologyDisplay";

describe("parseOrderBirthDateParts", () => {
  it("ゼロ埋めなしの月日を解釈する", () => {
    expect(parseOrderBirthDateParts("1977-4-1", null)).toEqual({
      year: 1977,
      month: 4,
      day: 1,
    });
  });

  it("ISO 日時の先頭だけ使う", () => {
    expect(parseOrderBirthDateParts("1988-06-06T00:00:00.000Z", null)).toEqual({
      year: 1988,
      month: 6,
      day: 6,
    });
  });

  it("文字列がダメでもフォールバックで復旧", () => {
    expect(
      parseOrderBirthDateParts("invalid", {
        birthYear: 1966,
        birthMonth: 11,
        birthDay: 27,
      }),
    ).toEqual({ year: 1966, month: 11, day: 27 });
  });
});

describe("numerologyWithRefreshedLifePath", () => {
  const minimalJson = JSON.stringify({
    lifePathNumber: 2,
    destinyNumber: 11,
    soulNumber: 6,
    personalityNumber: 5,
    birthdayNumber: 6,
    bridges: {
      lifePathDestiny: 9,
      soulPersonality: 1,
      birthdayLifePath: 4,
    },
  });

  it("通常の birthDate で LP を再計算する", () => {
    const n = numerologyWithRefreshedLifePath(minimalJson, "1988-06-06", {
      birthYear: 1988,
      birthMonth: 6,
      birthDay: 6,
    });
    expect(n?.lifePathNumber).toBe(11);
    expect(n?.birthdayNumber).toBe(6);
  });

  it("バースデーナンバーも生年月日から再計算する（11日→11）", () => {
    const json = JSON.stringify({
      lifePathNumber: 1,
      destinyNumber: null,
      soulNumber: null,
      personalityNumber: null,
      birthdayNumber: 2,
      bridges: {
        lifePathDestiny: null,
        soulPersonality: null,
        birthdayLifePath: 1,
      },
    });
    const n = numerologyWithRefreshedLifePath(json, "2008-08-11", {
      birthYear: 2008,
      birthMonth: 8,
      birthDay: 11,
    });
    expect(n?.birthdayNumber).toBe(11);
  });

  it("不完全な JSON でも正規化して表示できる", () => {
    const loose = JSON.stringify({
      lifePathNumber: "11",
      destinyNumber: null,
      birthdayNumber: 6,
    });
    const n = numerologyWithRefreshedLifePath(loose, "1988-06-06", {
      birthYear: 1988,
      birthMonth: 6,
      birthDay: 6,
    });
    expect(n).not.toBeNull();
    expect(n?.lifePathNumber).toBe(11);
    expect(n?.bridges?.birthdayLifePath).toBeDefined();
  });

  it("bridges 欠損でも正規化して落ちない", () => {
    const n = numerologyWithRefreshedLifePath(
      JSON.stringify({ lifePathNumber: 1, birthdayNumber: 9 }),
      "1969-03-09",
      { birthYear: 1969, birthMonth: 3, birthDay: 9 },
    );
    expect(n).not.toBeNull();
    expect(n?.bridges).toBeDefined();
  });

  it("normalizeNumerologyResult は配列を拒否", () => {
    expect(normalizeNumerologyResult([])).toBeNull();
  });
});
