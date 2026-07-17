import { describe, expect, it } from "vitest";

import {
  DIARY_COMMENT_CHARS_PER_LINE,
  getDiaryCommentLayoutForBinding,
  getDiaryCommentPdfLinesForBinding,
  isDiaryCommentOverPdfLineLimit,
  layoutDiaryComment,
  normalizeDiaryCommentForPdfFlow,
  splitDiaryCommentParagraphs,
  wrapJapaneseTextForDiaryComment,
} from "@/lib/journal/diaryPreviewCommentLineWrap";

describe("wrapJapaneseTextForDiaryComment", () => {
  it("keeps okurigana compounds on one line when possible", () => {
    const text =
      "仕事や勉強の中でも、いつもと違うやり方や小さな気づきがあったかもしれません。その変化を少し受け入れた分だけ、次の選択肢が静かに広がっていきます。";
    const lines = wrapJapaneseTextForDiaryComment(text);
    expect(lines.join("")).toBe(text);
    expect(lines.some((line) => line.endsWith("気") && !line.includes("気づき"))).toBe(false);
    expect(lines.some((line) => line.startsWith("づき"))).toBe(false);
    expect(lines.some((line) => line.startsWith("しれません"))).toBe(false);
    expect(lines.some((line) => line.endsWith("次") && !line.includes("次の"))).toBe(false);
    expect(lines.some((line) => line.startsWith("の選択"))).toBe(false);
    expect(lines.some((line) => line.includes("気づきがあったかもしれません。"))).toBe(true);
    expect(lines.some((line) => line.startsWith("かもしれ"))).toBe(false);
  });

  it("keeps 重なっています and 景色につながりやすい together when possible", () => {
    const text =
      "あなたの今日と、今月の流れが「5」で重なっています。いつもと少し違う選択が、次の景色につながりやすい日です。";
    const lines = wrapJapaneseTextForDiaryComment(text);
    expect(lines.join("")).toBe(text);
    expect(lines.some((line) => line.endsWith("重") && !line.includes("重な"))).toBe(false);
    expect(lines.some((line) => line.startsWith("なっています"))).toBe(false);
    expect(lines.some((line) => line.endsWith("景色") && !line.includes("景色に"))).toBe(false);
    expect(lines.some((line) => line.startsWith("につながりやすい"))).toBe(false);
  });

  it("avoids line-start punctuation", () => {
    const text = "挑戦を手ごたえに変えやすい日。動いてみたことで、できることや必要なことが現実的に見えたかもしれません。";
    const lines = wrapJapaneseTextForDiaryComment(text, { maxCharsPerLine: 18 });
    expect(lines.join("")).toBe(text);
    expect(lines.some((line) => /^[、。は、になりそう]/.test(line))).toBe(false);
    expect(lines.some((line) => line.startsWith("日。"))).toBe(false);
  });

  it("preserves paragraph breaks", () => {
    const text = "一段目の文章です。続きもあります。\n\n二段目の文章です。";
    expect(splitDiaryCommentParagraphs(text)).toEqual([
      "一段目の文章です。続きもあります。",
      "二段目の文章です。",
    ]);
    const items = layoutDiaryComment(text);
    expect(items.some((item) => item.kind === "paragraph-gap")).toBe(true);
  });
});

describe("getDiaryCommentLayoutForBinding", () => {
  it("uses configured chars per line", () => {
    expect(DIARY_COMMENT_CHARS_PER_LINE).toBe(30);
  });

  it("detects overflow when text exceeds binding capacity", () => {
    const long = "あ".repeat(DIARY_COMMENT_CHARS_PER_LINE * 9);
    const bound = getDiaryCommentLayoutForBinding(long);
    expect(bound.filter((item) => item.kind === "text").length).toBeLessThan(9);
  });
});

describe("getDiaryCommentPdfLinesForBinding", () => {
  it("collapses paragraph breaks into one flowing text", () => {
    const text = "一段目です。続きもあります。\n\n二段目です。終わり。";
    expect(normalizeDiaryCommentForPdfFlow(text)).toBe(
      "一段目です。続きもあります。二段目です。終わり。",
    );
    const lines = getDiaryCommentPdfLinesForBinding(text);
    expect(lines.join("")).toBe("一段目です。続きもあります。二段目です。終わり。");
    expect(lines.some((line) => line.length <= 1)).toBe(false);
    expect(lines.some((line) => /^に$|^日。$|^は、/.test(line))).toBe(false);
  });

  it("keeps pdf binding within max lines more easily without paragraph gaps", () => {
    const base = "仕事や勉強の中でも、いつもと違うやり方や小さな気づきがあったかもしれません。";
    const accent =
      "あなたの今日と、今月の流れが「5」で重なっています。いつもと少し違う選択が、次の景色につながりやすい日です。";
    const text = `${base}\n\n${accent}`;
    const lines = getDiaryCommentPdfLinesForBinding(text);
    expect(lines.length).toBeLessThanOrEqual(5);
    expect(isDiaryCommentOverPdfLineLimit(text)).toBe(false);
    expect(lines.join("")).toBe(normalizeDiaryCommentForPdfFlow(text));
    // PDF は固定幅機械分割。送り仮名の完全保護はプレビュー wrap 側の責務
    expect(lines.some((line) => line.startsWith("づき"))).toBe(false);
  });
});
