import { describe, expect, it } from "vitest";

import { getDestinyArticle } from "./destinyData";

describe("destinyData", () => {
  it("1〜9, 11, 22, 33 の本文を取得できる", () => {
    expect(getDestinyArticle(1)?.title).toContain("意志");
    expect(getDestinyArticle(2)?.title).toContain("つなぎ");
    expect(getDestinyArticle(3)?.title).toContain("楽しさ");
    expect(getDestinyArticle(4)?.title).toContain("積み上げ");
    expect(getDestinyArticle(5)?.title).toContain("変化");
    expect(getDestinyArticle(6)?.title).toContain("やさしさ");
    expect(getDestinyArticle(7)?.title).toContain("本質");
    expect(getDestinyArticle(8)?.title).toContain("現実");
    expect(getDestinyArticle(9)?.title).toContain("広い");
    expect(getDestinyArticle(11)?.title).toContain("ひらめき");
    expect(getDestinyArticle(22)?.title).toContain("理想");
    expect(getDestinyArticle(33)?.title).toContain("深い愛");
  });

  it("未登録番号は null を返す", () => {
    expect(getDestinyArticle(10)).toBeNull();
    expect(getDestinyArticle(null)).toBeNull();
  });
});
