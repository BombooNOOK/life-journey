import { describe, expect, it } from "vitest";

import {
  numerologyNumberMeaningsHref,
  numerologyNumbersBackLink,
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
