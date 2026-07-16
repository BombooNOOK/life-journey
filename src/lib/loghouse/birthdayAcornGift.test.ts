import { describe, expect, it } from "vitest";

import {
  birthdayGiftDateKey,
  isAccountBirthdayInJapan,
  japanCalendarYearFromDate,
} from "@/lib/loghouse/birthdayAcornGift";

describe("birthdayAcornGift", () => {
  it("builds year dateKey", () => {
    expect(birthdayGiftDateKey(2026)).toBe("bday-2026");
  });

  it("reads Japan calendar year", () => {
    expect(japanCalendarYearFromDate(new Date("2026-07-16T12:00:00+09:00"))).toBe(2026);
  });

  it("matches month/day in Japan", () => {
    expect(
      isAccountBirthdayInJapan({
        birthMonth: 7,
        birthDay: 13,
        now: new Date("2026-07-13T10:00:00+09:00"),
      }),
    ).toBe(true);
    expect(
      isAccountBirthdayInJapan({
        birthMonth: 7,
        birthDay: 13,
        now: new Date("2026-07-14T10:00:00+09:00"),
      }),
    ).toBe(false);
  });

  it("celebrates Feb 29 on Feb 28 in non-leap years", () => {
    expect(
      isAccountBirthdayInJapan({
        birthMonth: 2,
        birthDay: 29,
        now: new Date("2026-02-28T12:00:00+09:00"),
      }),
    ).toBe(true);
    expect(
      isAccountBirthdayInJapan({
        birthMonth: 2,
        birthDay: 29,
        now: new Date("2024-02-28T12:00:00+09:00"),
      }),
    ).toBe(false);
    expect(
      isAccountBirthdayInJapan({
        birthMonth: 2,
        birthDay: 29,
        now: new Date("2024-02-29T12:00:00+09:00"),
      }),
    ).toBe(true);
  });
});
