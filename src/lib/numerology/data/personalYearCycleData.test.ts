import { describe, expect, it } from "vitest";

import {
  PERSONAL_YEAR_CYCLE_DATA,
  personalYearCycleEntry,
  personalYearData,
} from "./personalYearCycleData";

describe("personalYearData / PERSONAL_YEAR_CYCLE_DATA", () => {
  it("同一参照", () => {
    expect(PERSONAL_YEAR_CYCLE_DATA).toBe(personalYearData);
  });

  it("1〜9 がすべて number と一致し、本文が入っている", () => {
    for (let n = 1; n <= 9; n++) {
      const row = personalYearData[n];
      expect(row.number).toBe(n);
      expect(row.theme.length).toBeGreaterThan(0);
      expect(row.subtitle.length).toBeGreaterThan(0);
      expect(row.article.length).toBeGreaterThan(0);
    }
  });
});

describe("personalYearCycleEntry", () => {
  it("1〜9 はデータ行を返す", () => {
    expect(personalYearCycleEntry(4).number).toBe(4);
    expect(personalYearCycleEntry(4).theme.length).toBeGreaterThan(0);
  });
});
