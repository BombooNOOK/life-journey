import { describe, expect, it } from "vitest";

import {
  numerologyNumberMeaningsHref,
  numerologyNumbersBackLink,
  parsePersonalDiaryNumbersFromSearchParams,
  parseSafeNumerologyNumbersReturnTo,
} from "@/lib/journal/numerologyNumbersNav";

describe("parseSafeNumerologyNumbersReturnTo", () => {
  it("accepts journal preview return path", () => {
    const path = "/journal/preview?entry=abc&pv=3";
    expect(parseSafeNumerologyNumbersReturnTo(path)).toBe(path);
  });

  it("rejects external URLs", () => {
    expect(parseSafeNumerologyNumbersReturnTo("//evil.example")).toBeNull();
  });
});

describe("numerologyNumberMeaningsHref", () => {
  it("appends returnTo query when safe", () => {
    expect(numerologyNumberMeaningsHref("/journal/preview?entry=abc")).toContain("returnTo=");
  });

  it("appends today month year when diary numbers are provided", () => {
    const href = numerologyNumberMeaningsHref("/journal/preview?entry=abc", {
      today: 8,
      month: 3,
      year: 6,
    });
    expect(href).toContain("today=8");
    expect(href).toContain("month=3");
    expect(href).toContain("year=6");
  });
});

describe("parsePersonalDiaryNumbersFromSearchParams", () => {
  it("accepts 1..9 for today month year", () => {
    expect(
      parsePersonalDiaryNumbersFromSearchParams({ today: "8", month: "3", year: "6" }),
    ).toEqual({ today: 8, month: 3, year: 6 });
  });

  it("rejects invalid values", () => {
    expect(parsePersonalDiaryNumbersFromSearchParams({ today: "10", month: "3", year: "6" })).toBeNull();
  });
});

describe("numerologyNumbersBackLink", () => {
  it("labels preview return", () => {
    expect(numerologyNumbersBackLink("/journal/preview?entry=abc").label).toBe(
      "日記プレビューへ戻る",
    );
  });

  it("labels list return", () => {
    expect(numerologyNumbersBackLink("/orders/list").label).toBe("日記一覧へ戻る");
  });
});
