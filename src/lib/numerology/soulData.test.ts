import { describe, expect, it } from "vitest";

import { getSoulArticle } from "./soulData";

describe("soulData", () => {
  it("1〜9, 11, 22, 33 の本文を取得できる", () => {
    expect(getSoulArticle(1)?.title).toContain("意志");
    expect(getSoulArticle(2)?.title).toContain("つながり");
    expect(getSoulArticle(3)?.title).toContain("楽しさ");
    expect(getSoulArticle(4)?.title).toContain("土台");
    expect(getSoulArticle(5)?.title).toContain("自由");
    expect(getSoulArticle(6)?.title).toContain("役に立ち");
    expect(getSoulArticle(7)?.title).toContain("静か");
    expect(getSoulArticle(8)?.title).toContain("強く");
    expect(getSoulArticle(9)?.title).toContain("広く");
    expect(getSoulArticle(11)?.title).toContain("美しい");
    expect(getSoulArticle(22)?.title).toContain("正しさ");
    expect(getSoulArticle(33)?.title).toContain("手を差し伸べ");
  });

  it("未登録番号は null を返す", () => {
    expect(getSoulArticle(10)).toBeNull();
    expect(getSoulArticle(null)).toBeNull();
  });
});
