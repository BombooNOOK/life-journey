import { describe, expect, it } from "vitest";

import {
  hiraganaToHepburn,
  normalizeProlongedSoundMarksInHiragana,
  romanizeFromKanaParts,
} from "./kanaToRomaji";

describe("hiraganaToHepburn", () => {
  it("基本のヘボン式を変換する", () => {
    expect(hiraganaToHepburn("し")).toBe("SHI");
    expect(hiraganaToHepburn("ち")).toBe("CHI");
    expect(hiraganaToHepburn("つ")).toBe("TSU");
    expect(hiraganaToHepburn("ふ")).toBe("FU");
    expect(hiraganaToHepburn("じ")).toBe("JI");
  });

  it("拗音を変換する", () => {
    expect(hiraganaToHepburn("しゃ")).toBe("SHA");
    expect(hiraganaToHepburn("しゅ")).toBe("SHU");
    expect(hiraganaToHepburn("しょ")).toBe("SHO");
    expect(hiraganaToHepburn("ちゃ")).toBe("CHA");
    expect(hiraganaToHepburn("ちゅ")).toBe("CHU");
    expect(hiraganaToHepburn("ちょ")).toBe("CHO");
    expect(hiraganaToHepburn("きゃ")).toBe("KYA");
    expect(hiraganaToHepburn("きゅ")).toBe("KYU");
    expect(hiraganaToHepburn("きょ")).toBe("KYO");
    expect(hiraganaToHepburn("りゃ")).toBe("RYA");
    expect(hiraganaToHepburn("りゅ")).toBe("RYU");
    expect(hiraganaToHepburn("りょ")).toBe("RYO");
  });

  it("促音・ん・長音を扱う", () => {
    expect(hiraganaToHepburn("がっこう")).toBe("GAKKO");
    expect(hiraganaToHepburn("しんよう")).toBe("SHIN'YO");
    expect(hiraganaToHepburn("らーめん")).toBe("RAAMEN");
  });

  it("長音「ー」は正規化後も従来どおりのローマ字になる（びりー＝びりい）", () => {
    expect(normalizeProlongedSoundMarksInHiragana("びりー")).toBe("びりい");
    expect(hiraganaToHepburn("びりー")).toBe(hiraganaToHepburn("びりい"));
    expect(hiraganaToHepburn("びりー")).toBe("BIRII");
  });

  it("あーむ は ああむ と同じ結果", () => {
    expect(normalizeProlongedSoundMarksInHiragana("あーむ")).toBe("ああむ");
    expect(hiraganaToHepburn("あーむ")).toBe(hiraganaToHepburn("ああむ"));
  });

  it("ん＋唇音（b/m/p 行）は n を m に同化（ヘボン式）", () => {
    expect(hiraganaToHepburn("けんみん")).toBe("KEMMIN");
    expect(hiraganaToHepburn("しんぶん")).toBe("SHIMBUN");
    expect(hiraganaToHepburn("さんぽ")).toBe("SAMPO");
    expect(hiraganaToHepburn("ほんま")).toBe("HOMMA");
    expect(hiraganaToHepburn("えんぴつ")).toBe("EMPITSU");
  });
});

describe("romanizeFromKanaParts", () => {
  it("姓 名の順で結合する", () => {
    const r = romanizeFromKanaParts("やまだ", "たろう");
    expect(r.lastNameRoman).toBe("YAMADA");
    expect(r.firstNameRoman).toBe("TARO");
    expect(r.romanNameForDisplay).toBe("YAMADA TARO");
    expect(r.romanNameForNumerology).toBe("YAMADA TARO");
  });
});
