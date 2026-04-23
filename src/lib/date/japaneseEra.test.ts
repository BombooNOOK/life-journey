import { describe, expect, it } from "vitest";

import {
  formatEraDateFromIso,
  formatYearOptionLabel,
  resolveJapaneseEra,
} from "./japaneseEra";

describe("resolveJapaneseEra", () => {
  it("改元境界日を正しく判定する", () => {
    expect(resolveJapaneseEra(1989, 1, 7)).toEqual({ eraKanji: "昭和", eraYear: 64 });
    expect(resolveJapaneseEra(1989, 1, 8)).toEqual({ eraKanji: "平成", eraYear: 1 });
    expect(resolveJapaneseEra(2019, 4, 30)).toEqual({ eraKanji: "平成", eraYear: 31 });
    expect(resolveJapaneseEra(2019, 5, 1)).toEqual({ eraKanji: "令和", eraYear: 1 });
  });
});

describe("formatYearOptionLabel", () => {
  it("年プルダウンラベルを併記できる", () => {
    expect(formatYearOptionLabel(1988)).toBe("1988年（昭和63年）");
    expect(formatYearOptionLabel(1989)).toBe("1989年（昭和64年・平成元年）");
    expect(formatYearOptionLabel(2019)).toBe("2019年（平成31年・令和元年）");
    expect(formatYearOptionLabel(2020)).toBe("2020年（令和2年）");
  });
});

describe("formatEraDateFromIso", () => {
  it("保存済みISO日付で厳密に和暦を判定する", () => {
    expect(formatEraDateFromIso("1989-01-07")).toBe("昭和64年1月7日");
    expect(formatEraDateFromIso("1989-01-08")).toBe("平成元年1月8日");
    expect(formatEraDateFromIso("2019-04-30")).toBe("平成31年4月30日");
    expect(formatEraDateFromIso("2019-05-01")).toBe("令和元年5月1日");
  });
});
