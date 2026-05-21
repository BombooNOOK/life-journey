import { describe, expect, it } from "vitest";

import {
  DIARY_BINDING_MAX_PAGES,
  DIARY_BOOK_LIGHT_URL,
  DIARY_BOOK_TRIAL_URL,
  getBookPlan,
} from "./bookBindingPlan";

describe("getBookPlan", () => {
  it("1〜50ページはお試し製本版", () => {
    expect(getBookPlan(1).plan).toBe("trial");
    expect(getBookPlan(50).plan).toBe("trial");
    expect(getBookPlan(50).maxPages).toBe(50);
    expect(getBookPlan(50).priceYen).toBe(1980);
    expect(getBookPlan(50).baseUrl).toBe(DIARY_BOOK_TRIAL_URL);
  });

  it("51〜100ページはライト製本版", () => {
    expect(getBookPlan(51).plan).toBe("light");
    expect(getBookPlan(100).plan).toBe("light");
    expect(getBookPlan(100).maxPages).toBe(100);
    expect(getBookPlan(51).baseUrl).toBe(DIARY_BOOK_LIGHT_URL);
  });

  it("101〜200ページはスタンダード製本版", () => {
    expect(getBookPlan(101).plan).toBe("standard");
    expect(getBookPlan(200).plan).toBe("standard");
    expect(getBookPlan(200).productName).toBe("Life Journey Diary スタンダード製本版");
  });

  it("201〜400ページはまるごと1年製本版", () => {
    expect(getBookPlan(201).plan).toBe("full_year");
    expect(getBookPlan(400).plan).toBe("full_year");
    expect(getBookPlan(400).maxPages).toBe(DIARY_BINDING_MAX_PAGES);
  });

  it("401ページ以上は対象外", () => {
    const p = getBookPlan(401);
    expect(p.plan).toBe("over_limit");
    expect(p.orderable).toBe(false);
    expect(p.baseUrl).toBeNull();
  });

  it("0ページはお試し版だが注文不可", () => {
    const p = getBookPlan(0);
    expect(p.plan).toBe("trial");
    expect(p.orderable).toBe(false);
  });
});
