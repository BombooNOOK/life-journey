import { describe, expect, it } from "vitest";

import {
  formatInsideCoverBornLine,
  formatInsideCoverForName,
  numerologyRomanWesternDisplayName,
} from "./pdfInsideCoverRecipientCopy";
import { romanizeFromKanaParts } from "@/lib/numerology/kanaToRomaji";

describe("numerologyRomanWesternDisplayName", () => {
  it("matches numerology join: fullNameRomanDisplay is LAST FIRST, display is FIRST LAST", () => {
    const romanized = romanizeFromKanaParts("やまだ", "たろう");
    expect(romanized.romanNameForNumerology).toBe("YAMADA TARO");
    expect(
      numerologyRomanWesternDisplayName({
        firstNameRoman: romanized.firstNameRoman,
        lastNameRoman: romanized.lastNameRoman,
        fullNameRomanDisplay: romanized.romanNameForNumerology,
        lastNameKana: "やまだ",
        firstNameKana: "たろう",
        fullNameDisplay: "山田 太郎",
        fullNameKanaDisplay: "やまだ たろう",
      }),
    ).toBe("Taro Yamada");
  });

  it("re-romanizes from birth kana when roman parts are empty", () => {
    expect(
      numerologyRomanWesternDisplayName({
        firstNameRoman: "",
        lastNameRoman: "",
        fullNameRomanDisplay: "",
        lastNameKana: "きむら",
        firstNameKana: "もぐ",
        fullNameDisplay: "木村 モグ",
        fullNameKanaDisplay: "きむら もぐ",
      }),
    ).toBe("Mogu Kimura");
  });

  it("decodes fullNameRomanDisplay only when parts missing", () => {
    expect(
      numerologyRomanWesternDisplayName({
        firstNameRoman: "",
        lastNameRoman: "",
        fullNameRomanDisplay: "KIMURA MOGU",
        lastNameKana: "",
        firstNameKana: "",
        fullNameDisplay: "木村 モグ",
        fullNameKanaDisplay: "",
      }),
    ).toBe("Mogu Kimura");
  });
});

describe("formatInsideCoverForName", () => {
  it("prefixes for", () => {
    expect(
      formatInsideCoverForName({
        firstNameRoman: "MOGU",
        lastNameRoman: "KIMURA",
        fullNameRomanDisplay: "KIMURA MOGU",
        lastNameKana: "きむら",
        firstNameKana: "もぐ",
        fullNameDisplay: "木村 モグ",
        fullNameKanaDisplay: "きむら もぐ",
      }),
    ).toBe("for Mogu Kimura");
  });

  it("falls back to Japanese display name only without roman", () => {
    expect(
      formatInsideCoverForName({
        firstNameRoman: "",
        lastNameRoman: "",
        fullNameRomanDisplay: "",
        lastNameKana: "",
        firstNameKana: "",
        fullNameDisplay: "山田 太郎",
        fullNameKanaDisplay: "やまだ たろう",
      }),
    ).toBe("for 山田 太郎");
  });
});

describe("formatInsideCoverBornLine", () => {
  it("formats English birth line", () => {
    expect(
      formatInsideCoverBornLine({
        birthYear: 2025,
        birthMonth: 7,
        birthDay: 12,
        birthDate: "2025-07-12",
      }),
    ).toBe("Born on July 12, 2025");
  });
});
