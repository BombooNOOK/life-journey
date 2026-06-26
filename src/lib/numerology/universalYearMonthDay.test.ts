import { describe, expect, it } from "vitest";

import {
  formatUniversalCycleBreakdown,
  splitTwoDigitParts,
  universalCycleNumbersFromYMD,
  universalDayNumber,
  universalMonthNumber,
  universalYearNumber,
} from "./universalYearMonthDay";

describe("splitTwoDigitParts", () => {
  it("6 → 0 と 6、24 → 2 と 4", () => {
    expect(splitTwoDigitParts(6)).toEqual({ tens: 0, ones: 6 });
    expect(splitTwoDigitParts(24)).toEqual({ tens: 2, ones: 4 });
    expect(splitTwoDigitParts(10)).toEqual({ tens: 1, ones: 0 });
  });
});

describe("universalYearNumber", () => {
  it("西暦年を 1 桁まで縮約（2026 → 1）", () => {
    expect(universalYearNumber(2026)).toBe(1);
  });
});

describe("universalMonthNumber", () => {
  it("UY + 月の各桁（6 月 → 1+0+6）", () => {
    expect(universalMonthNumber(1, 6)).toBe(7);
  });

  it("10 月は 1+0 として足す", () => {
    expect(universalMonthNumber(1, 10)).toBe(2);
  });
});

describe("universalDayNumber", () => {
  it("UM + 日の各桁（24 日 → 7+2+4）", () => {
    expect(universalDayNumber(7, 24)).toBe(4);
  });

  it("5 日は 0+5 として足す", () => {
    expect(universalDayNumber(7, 5)).toBe(3);
  });
});

describe("universalCycleNumbersFromYMD", () => {
  it("2026-06-24 のユニバーサルデイは 4", () => {
    expect(universalCycleNumbersFromYMD(2026, 6, 24)).toEqual({
      universalYear: 1,
      universalMonth: 7,
      universalDay: 4,
    });
  });
});

describe("formatUniversalCycleBreakdown", () => {
  it("2026-06-24 の途中式を 7+2+4 形式で示す", () => {
    expect(formatUniversalCycleBreakdown(2026, 6, 24)).toBe(
      "UY 1 + 月 6 → UM 7 + 日 2 + 4 → UD 4",
    );
  });
});
