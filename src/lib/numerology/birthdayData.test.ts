import { describe, expect, it } from "vitest";

import { getBirthdayArticle } from "./birthdayData";

describe("birthdayData", () => {
  it("1〜9, 11, 22 の本文を取得できる", () => {
    expect(getBirthdayArticle(1)?.strength).toBe("行動力");
    expect(getBirthdayArticle(2)?.strength).toBe("協調性");
    expect(getBirthdayArticle(3)?.strength).toBe("楽観性");
    expect(getBirthdayArticle(4)?.strength).toBe("計画力");
    expect(getBirthdayArticle(5)?.strength).toBe("冒険心");
    expect(getBirthdayArticle(6)?.strength).toBe("育てる力");
    expect(getBirthdayArticle(7)?.strength).toBe("観察力");
    expect(getBirthdayArticle(8)?.strength).toBe("実現力");
    expect(getBirthdayArticle(9)?.strength).toBe("共感力");
    expect(getBirthdayArticle(11)?.strength).toBe("直観力");
    expect(getBirthdayArticle(22)?.strength).toBe("意志力");
  });

  it("未登録番号は null を返す", () => {
    expect(getBirthdayArticle(33)).toBeNull();
    expect(getBirthdayArticle(null)).toBeNull();
  });
});
