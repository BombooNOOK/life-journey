import { describe, expect, it } from "vitest";

import {
  formatDiaryBookTagScopeSummary,
  normalizeDiaryBookTagFilterStorage,
  parseDiaryBookTagFilterFields,
  parseDiaryBookTagFilterFromRequest,
} from "./diaryBookTagFilter";

describe("diaryBookTagFilter", () => {
  it("normalizeDiaryBookTagFilterStorage は #付き正規化タグ行を返す", () => {
    expect(normalizeDiaryBookTagFilterStorage("こども #おでかけ")).toBe("#こども #おでかけ");
    expect(normalizeDiaryBookTagFilterStorage("   ")).toBe("");
  });

  it("parseDiaryBookTagFilterFields は空タグで AND を返す", () => {
    expect(parseDiaryBookTagFilterFields({ tagFilter: "", tagFilterMode: "OR" })).toEqual({
      ok: true,
      data: { tagFilter: "", tagFilterMode: "AND" },
    });
  });

  it("parseDiaryBookTagFilterFields は AND/OR を検証する", () => {
    expect(
      parseDiaryBookTagFilterFields({
        tagFilter: "#こども #おでかけ",
        tagFilterMode: "OR",
      }),
    ).toEqual({
      ok: true,
      data: { tagFilter: "#こども #おでかけ", tagFilterMode: "OR" },
    });

    expect(
      parseDiaryBookTagFilterFields({
        tagFilter: "#こども",
        tagFilterMode: "MAYBE",
      }).ok,
    ).toBe(false);
  });

  it("parseDiaryBookTagFilterFromRequest は legacy tag を OR として扱う", () => {
    expect(parseDiaryBookTagFilterFromRequest({ tag: "#こども #おでかけ" })).toEqual({
      tagFilter: "#こども #おでかけ",
      tagFilterMode: "OR",
    });
  });

  it("formatDiaryBookTagScopeSummary", () => {
    expect(
      formatDiaryBookTagScopeSummary({
        tagFilter: "#こども #おでかけ",
        tagFilterMode: "AND",
      }),
    ).toBe("#こども #おでかけ（すべて含む）");
    expect(
      formatDiaryBookTagScopeSummary({ tagFilter: "", tagFilterMode: "AND" }),
    ).toBeNull();
  });
});
