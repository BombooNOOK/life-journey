import { describe, expect, it } from "vitest";

import {
  getPersonalDayOneLineMessage,
  getPersonalDayOneLineMessageByBirthDate,
} from "./personalDayMessage";

describe("getPersonalDayOneLineMessage", () => {
  it("同じ条件では同じ一行を返す", () => {
    const date = new Date("2026-04-16T09:00:00+09:00");
    const a = getPersonalDayOneLineMessage({
      personalMonthNumber: 4,
      personalDayNumber: 3,
      date,
      userSeed: "user-001",
    });
    const b = getPersonalDayOneLineMessage({
      personalMonthNumber: 4,
      personalDayNumber: 3,
      date,
      userSeed: "user-001",
    });

    expect(a.message).toBe(b.message);
    expect(a.candidateIndex).toBe(b.candidateIndex);
  });

  it("userSeed が違うと候補が変わりうる", () => {
    const date = new Date("2026-04-16T09:00:00+09:00");
    const results = new Set(
      Array.from({ length: 30 }, (_, i) => `seed-${i}`).map((seed) =>
        getPersonalDayOneLineMessage({
          personalMonthNumber: 4,
          personalDayNumber: 3,
          date,
          userSeed: seed,
        }).candidateIndex,
      ),
    );
    expect(results.size).toBeGreaterThan(1);
  });

  it("無効な番号ではフォールバック文を返す", () => {
    const result = getPersonalDayOneLineMessage({
      personalMonthNumber: 99,
      personalDayNumber: 99,
      date: new Date("2026-04-16T00:00:00+09:00"),
    });
    expect(result.message).toContain("書き留めてみたい");
  });
});

describe("getPersonalDayOneLineMessageByBirthDate", () => {
  it("誕生日と日付から month/day を算出して返す", () => {
    const result = getPersonalDayOneLineMessageByBirthDate({
      birthMonth: 6,
      birthDay: 6,
      date: new Date("2026-04-16T09:00:00+09:00"),
      userSeed: "abc",
    });
    expect(result.personalMonthNumber).toBeGreaterThanOrEqual(1);
    expect(result.personalMonthNumber).toBeLessThanOrEqual(9);
    expect(result.personalDayNumber).toBeGreaterThanOrEqual(1);
    expect(result.personalDayNumber).toBeLessThanOrEqual(9);
    expect(result.message.length).toBeGreaterThan(0);
  });
});
