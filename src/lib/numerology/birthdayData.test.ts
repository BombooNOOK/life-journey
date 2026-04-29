import { describe, expect, it } from "vitest";

import { getBirthdayArticle } from "./birthdayData";

describe("birthdayData", () => {
  it("1〜9, 11, 22 の本文を取得できる", () => {
    expect(getBirthdayArticle(1)?.strength).toBe("行動力で流れを動かす人");
    expect(getBirthdayArticle(2)?.strength).toBe("協調の中で流れを整える人");
    expect(getBirthdayArticle(3)?.strength).toBe("軽やかさで流れをやわらげる人");
    expect(getBirthdayArticle(4)?.strength).toBe("積み重ねで形をつくる人");
    expect(getBirthdayArticle(5)?.strength).toBe("変化を楽しみながら広がる人");
    expect(getBirthdayArticle(6)?.strength).toBe("愛情で支え育てる人");
    expect(getBirthdayArticle(7)?.strength).toBe("見つめることで理解を深める人");
    expect(getBirthdayArticle(8)?.strength).toBe("現実を動かし形にする人");
    expect(getBirthdayArticle(9)?.strength).toBe("共感で人を理解する人");
    expect(getBirthdayArticle(11)?.strength).toBe("直感で気づきを受け取る人");
    expect(getBirthdayArticle(22)?.strength).toBe("意志で大きな流れをつくる人");
  });

  it("未登録番号は null を返す", () => {
    expect(getBirthdayArticle(33)).toBeNull();
    expect(getBirthdayArticle(null)).toBeNull();
  });
});
