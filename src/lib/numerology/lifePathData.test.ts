import { describe, expect, it } from "vitest";

import { getLifePathArticle, lifePathSectionOrder } from "./lifePathData";

describe("lifePathData", () => {
  it("1〜9, 11, 22, 33 の本文を取得できる", () => {
    const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33] as const;
    for (const k of keys) {
      const a = getLifePathArticle(k);
      expect(a).not.toBeNull();
      if (!a) continue;
      expect(a.title.length).toBeGreaterThan(0);
      expect(a.sections.basic.length).toBeGreaterThan(20);
    }
  });

  it("未登録番号は null を返す", () => {
    expect(getLifePathArticle(10)).toBeNull();
    expect(getLifePathArticle(null)).toBeNull();
  });

  it("セクション順が固定されている", () => {
    expect(lifePathSectionOrder).toEqual([
      "basic",
      "love",
      "work",
      "money",
      "relationship",
      "health",
    ]);
  });
});
