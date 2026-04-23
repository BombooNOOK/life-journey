import { describe, expect, it } from "vitest";

import {
  buildPersonalMonthThreeMonthRows,
  buildPersonalYearNineYearRows,
  personalDayNumber,
  personalMonthNumber,
  personalYearNumber,
  reducePersonalCycleNumber,
} from "./personalYearMonth";

describe("reducePersonalCycleNumber", () => {
  it("11 / 22 / 33 を残さず 1 桁へ", () => {
    expect(reducePersonalCycleNumber(11)).toBe(2);
    expect(reducePersonalCycleNumber(22)).toBe(4);
    expect(reducePersonalCycleNumber(33)).toBe(6);
  });
});

describe("personalYearNumber", () => {
  it("生月 + 生日 + 対象年 を縮約（例: 6+6+2026）", () => {
    expect(personalYearNumber(6, 6, 2026)).toBe(4);
  });
});

describe("personalMonthNumber", () => {
  it("パーソナルイヤー + 月 を縮約", () => {
    expect(personalMonthNumber(4, 1)).toBe(5);
    expect(personalMonthNumber(4, 12)).toBe(7);
  });
});

describe("personalDayNumber", () => {
  it("パーソナルマンス + 日 を縮約", () => {
    expect(personalDayNumber(5, 16)).toBe(3);
    expect(personalDayNumber(7, 31)).toBe(2);
  });
});

describe("buildPersonalYearNineYearRows", () => {
  it("基準年から 9 年分の行を返す", () => {
    const ref = new Date(2026, 2, 15);
    const rows = buildPersonalYearNineYearRows(6, 6, ref);
    expect(rows).toHaveLength(9);
    expect(rows[0].calendarYear).toBe(2026);
    expect(rows[8].calendarYear).toBe(2034);
    expect(rows[0].cycleNumber).toBe(4);
    expect(rows[0].theme).toBe("安定させる・基礎を固める");
    expect(rows[0]).toHaveProperty("subtitle");
    expect(rows[0]).toHaveProperty("article");
  });

  it("基準が 2027 年なら 2027〜2035", () => {
    const ref = new Date(2027, 0, 1);
    const rows = buildPersonalYearNineYearRows(1, 1, ref);
    expect(rows[0].calendarYear).toBe(2027);
    expect(rows[8].calendarYear).toBe(2035);
  });
});

describe("buildPersonalMonthThreeMonthRows", () => {
  it("購入月を含む3か月分を返す（年またぎ対応）", () => {
    const rows = buildPersonalMonthThreeMonthRows(6, 6, new Date("2026-12-13T12:00:00Z"));
    expect(rows).toHaveLength(3);
    expect(rows[0].calendarYear).toBe(2026);
    expect(rows[0].calendarMonth).toBe(12);
    expect(rows[1].calendarYear).toBe(2027);
    expect(rows[1].calendarMonth).toBe(1);
    expect(rows[2].calendarYear).toBe(2027);
    expect(rows[2].calendarMonth).toBe(2);
    expect(rows[0].personalMonthNumber).toBeGreaterThanOrEqual(1);
    expect(rows[0].personalMonthNumber).toBeLessThanOrEqual(9);
  });
});
