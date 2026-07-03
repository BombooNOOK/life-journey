import { describe, expect, it } from "vitest";

import {
  collectDiaryTagsFromContents,
  extractTagsFromContent,
  formatDiaryTagsForInput,
  matchTag,
  matchesDiaryKeyword,
  mergeTagsIntoContent,
  parseDiaryTagInput,
  stripTagsFromContent,
} from "./diaryTags";

describe("diaryTags", () => {
  it("parseDiaryTagInput は全角＃を半角にし重複を除く", () => {
    expect(parseDiaryTagInput("＃モグ #おでかけ ＃モグ")).toEqual(["モグ", "おでかけ"]);
  });

  it("extractTagsFromContent は末尾タグ行だけを剥がす", () => {
    const content = "今日は楽しかった。\n\n#モグ #おでかけ";
    expect(extractTagsFromContent(content)).toEqual({
      body: "今日は楽しかった。",
      tags: ["モグ", "おでかけ"],
    });
  });

  it("末尾タグ行：本文とタグを正しく分離する", () => {
    const content = "今日はモグと遊んだ。\n\n#モグ #おでかけ";
    expect(stripTagsFromContent(content)).toBe("今日はモグと遊んだ。");
    expect(extractTagsFromContent(content)).toEqual({
      body: "今日はモグと遊んだ。",
      tags: ["モグ", "おでかけ"],
    });
  });

  it("本文中の #モグ は残しタグにしない", () => {
    const content = "今日は #モグ と遊んだ。\nとてもかわいかった。";
    expect(stripTagsFromContent(content)).toBe(content);
    expect(extractTagsFromContent(content)).toEqual({
      body: content,
      tags: [],
    });
  });

  it("#モグ がかわいかった。は文なのでタグ行にしない", () => {
    const content = "#モグ がかわいかった。";
    expect(stripTagsFromContent(content)).toBe(content);
    expect(extractTagsFromContent(content).tags).toEqual([]);
  });

  it("行末にタグ風文字列があっても文が混ざればタグ行にしない", () => {
    const content = "今日は楽しかった。 #おでかけ";
    expect(stripTagsFromContent(content)).toBe(content);
    expect(extractTagsFromContent(content).tags).toEqual([]);
  });

  it("#モグと遊んだ。のように # 直後に文が続く行はタグ行にしない", () => {
    const content = "#モグと遊んだ。";
    expect(stripTagsFromContent(content)).toBe(content);
    expect(extractTagsFromContent(content).tags).toEqual([]);
  });

  it("本文中の # はタグとして扱わない（複数行）", () => {
    const content = "本文に #メモ と書いた\n2行目";
    expect(extractTagsFromContent(content).tags).toEqual([]);
    expect(extractTagsFromContent(content).body).toBe(content);
  });

  it("mergeTagsIntoContent はタグ空なら本文のみ", () => {
    expect(mergeTagsIntoContent("本文だけ", "")).toBe("本文だけ");
    expect(mergeTagsIntoContent("本文だけ", "   ")).toBe("本文だけ");
  });

  it("mergeTagsIntoContent はタグ行を末尾に付与する", () => {
    expect(mergeTagsIntoContent("本文", "＃モグ #家族")).toBe("本文\n\n#モグ #家族");
  });

  it("stripTagsFromContent は末尾タグ行のみ除去する", () => {
    const raw = "一行目\n\n#モグ";
    expect(stripTagsFromContent(raw)).toBe("一行目");
  });

  it("matchTag は末尾タグのみ照合する", () => {
    const content = "本文 #メモ\n\n#モグ";
    expect(matchTag(content, "モグ")).toBe(true);
    expect(matchTag(content, "メモ")).toBe(false);
    expect(matchTag(content, "#モグ")).toBe(true);
  });

  it("matchesDiaryKeyword はタグ行を検索対象にしない", () => {
    const content = "本文のみ\n\n#モグ";
    expect(matchesDiaryKeyword(content, "本文")).toBe(true);
    expect(matchesDiaryKeyword(content, "モグ")).toBe(false);
  });

  it("collectDiaryTagsFromContents はユニークタグを集める", () => {
    expect(
      collectDiaryTagsFromContents([
        "a\n\n#モグ",
        "b\n\n#おでかけ #モグ",
      ]),
    ).toEqual(["おでかけ", "モグ"]);
  });

  it("formatDiaryTagsForInput", () => {
    expect(formatDiaryTagsForInput(["モグ", "家族"])).toBe("#モグ #家族");
  });
});
