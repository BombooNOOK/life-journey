import { describe, expect, it } from "vitest";

import { getBookPlan } from "./bookBindingPlan";

describe("getBookPlan", () => {
  it("30枚以下はお試し版", () => {
    expect(getBookPlan(0).plan).toBe("trial");
    expect(getBookPlan(30).plan).toBe("trial");
  });

  it("31〜80はライト版", () => {
    expect(getBookPlan(31).plan).toBe("light");
    expect(getBookPlan(80).plan).toBe("light");
  });

  it("81〜120はスタンダード版", () => {
    expect(getBookPlan(81).plan).toBe("standard");
    expect(getBookPlan(120).plan).toBe("standard");
  });

  it("121以上はスタンダード＋追加単位（20ページ刻みの切り上げ）", () => {
    const p121 = getBookPlan(121);
    expect(p121.plan).toBe("standard_plus");
    expect(p121.extra).toBe(1);

    const p140 = getBookPlan(140);
    expect(p140.extra).toBe(1);

    const p141 = getBookPlan(141);
    expect(p141.extra).toBe(2);
  });
});
