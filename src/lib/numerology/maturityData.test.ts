import { describe, expect, it } from "vitest";

import { getMaturityArticle } from "./maturityData";

describe("getMaturityArticle", () => {
  it("登録済みナンバーでは title と article を返す", () => {
    const a = getMaturityArticle(1);
    expect(a).not.toBeNull();
    expect(a?.title).toContain("新しい道");
    expect(a?.article).toContain("マチュリティ");
  });

  it("11 と 22 も参照できる", () => {
    expect(getMaturityArticle(11)?.title).toContain("時を越え");
    expect(getMaturityArticle(22)?.title).toContain("理想");
  });

  it("未登録・null は null", () => {
    expect(getMaturityArticle(10)).toBeNull();
    expect(getMaturityArticle(33)).toBeNull();
    expect(getMaturityArticle(null)).toBeNull();
    expect(getMaturityArticle(undefined)).toBeNull();
  });
});
