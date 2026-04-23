import { describe, expect, it } from "vitest";

import type { BirthDateParts } from "./types";
import { lifePathFromBirthDate, ymdEightDigitSum } from "./compute";
import {
  formatLifePathTraceJa,
  traceLifePathFromBirthDate,
  traceLifePathSplitReduceReference,
} from "./lifePathTrace";
import { reduceToCoreNumber, sumDigits } from "./reduce";

/** 参考: 月だけ先に桁和（11月→2） */
function lifePathReference_sumDigitsMonthFirst(parts: BirthDateParts): number {
  const a = sumDigits(parts.month);
  const b = reduceToCoreNumber(parts.day);
  const c = reduceToCoreNumber(parts.year);
  return reduceToCoreNumber(a + b + c);
}

/** prisma/dev.db にあった実注文の日付 */
const FUKUYAMA_IN_DB: BirthDateParts = { year: 1977, month: 4, day: 1 };
const TAKAHASHI_IN_DB: BirthDateParts = { year: 1988, month: 6, day: 6 };

describe("lifePathFromBirthDate（楽天仕様: YYYYMMDD 8桁の桁和 → 縮約）", () => {
  it("実データ: 福山理沙 1977-04-01 → LP=11", () => {
    expect(lifePathFromBirthDate(FUKUYAMA_IN_DB)).toBe(11);
    expect(ymdEightDigitSum(FUKUYAMA_IN_DB).digitSum).toBe(29);
  });

  it("実データ: 高橋翔子 1988-06-06 → LP=11", () => {
    expect(lifePathFromBirthDate(TAKAHASHI_IN_DB)).toBe(11);
    expect(ymdEightDigitSum(TAKAHASHI_IN_DB).digitSum).toBe(38);
  });

  it("8桁トレース: 1988-06-06", () => {
    const t = traceLifePathFromBirthDate(TAKAHASHI_IN_DB);
    expect(t.ymdString).toBe("19880606");
    expect(t.digitSum).toBe(38);
    expect(t.finalChain).toEqual([38, 11]);
    expect(t.result).toBe(11);
    expect(formatLifePathTraceJa(t).join("\n")).toContain("ライフ・パス 11");
  });

  it("通常ケース: 1桁に落ちる例 2008-04-05 → LP=1", () => {
    expect(lifePathFromBirthDate({ year: 2008, month: 4, day: 5 })).toBe(1);
  });

  it("2007-11-09 は全桁和 20 → LP=2（分割縮約なら 11 だったが、楽天仕様では 2）", () => {
    expect(lifePathFromBirthDate({ year: 2007, month: 11, day: 9 })).toBe(2);
    const split = traceLifePathSplitReduceReference({ year: 2007, month: 11, day: 9 });
    expect(split.result).toBe(11);
  });

  it("2000-11-09 は全桁和 13 → LP=4", () => {
    expect(lifePathFromBirthDate({ year: 2000, month: 11, day: 9 })).toBe(4);
  });

  it("2001-01-02 → LP=6", () => {
    expect(lifePathFromBirthDate({ year: 2001, month: 1, day: 2 })).toBe(6);
  });

  it("2001-01-11 → LP=6", () => {
    expect(lifePathFromBirthDate({ year: 2001, month: 1, day: 11 })).toBe(6);
  });

  it("参考: 月桁和の誤りは 2007-11-09 で 2（本採用も 2 で一致）", () => {
    const nov: BirthDateParts = { year: 2007, month: 11, day: 9 };
    expect(lifePathReference_sumDigitsMonthFirst(nov)).toBe(2);
    expect(lifePathFromBirthDate(nov)).toBe(2);
  });
});
