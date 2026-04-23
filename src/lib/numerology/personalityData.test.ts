import { describe, expect, it } from "vitest";

import { getPersonalityArticle } from "./personalityData";

describe("personalityData", () => {
  it("1〜9, 11, 22, 33 の本文を取得できる", () => {
    expect(getPersonalityArticle(1)?.title).toContain("前に立って");
    expect(getPersonalityArticle(2)?.title).toContain("場を整える");
    expect(getPersonalityArticle(3)?.title).toContain("明るさ");
    expect(getPersonalityArticle(4)?.title).toContain("信頼できる");
    expect(getPersonalityArticle(5)?.title).toContain("変化を受け入れる");
    expect(getPersonalityArticle(6)?.title).toContain("包み込む");
    expect(getPersonalityArticle(7)?.title).toContain("距離を感じ");
    expect(getPersonalityArticle(8)?.title).toContain("力強く");
    expect(getPersonalityArticle(9)?.title).toContain("溶け込み");
    expect(getPersonalityArticle(11)?.title).toContain("特別な雰囲気");
    expect(getPersonalityArticle(22)?.title).toContain("粘り強く");
    expect(getPersonalityArticle(33)?.title).toContain("癒しを与える");
  });

  it("未登録番号は null を返す", () => {
    expect(getPersonalityArticle(10)).toBeNull();
    expect(getPersonalityArticle(null)).toBeNull();
  });
});
