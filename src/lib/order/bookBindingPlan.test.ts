import { describe, expect, it } from "vitest";

import { DIARY_BINDING_MAX_PAGES, getBookPlan } from "./bookBindingPlan";

describe("getBookPlan", () => {
  it("1〜35ページはお試し製本版", () => {
    expect(getBookPlan(1).plan).toBe("trial");
    expect(getBookPlan(35).plan).toBe("trial");
    expect(getBookPlan(35).priceYen).toBe(1980);
  });

  it("36〜100ページはライト製本版", () => {
    expect(getBookPlan(36).plan).toBe("light");
    expect(getBookPlan(100).plan).toBe("light");
    expect(getBookPlan(100).maxPages).toBe(100);
  });

  it("101〜200ページはスタンダード製本版", () => {
    expect(getBookPlan(101).plan).toBe("standard");
    expect(getBookPlan(200).plan).toBe("standard");
  });

  it("201〜400ページはまるごと一年製本版", () => {
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
