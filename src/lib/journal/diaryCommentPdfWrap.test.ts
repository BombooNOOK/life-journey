import { describe, expect, it } from "vitest";

import {
  DIARY_COMMENT_PDF_CHARS_PER_LINE,
  getDiaryCommentPdfLinesForBinding,
  isDiaryCommentOverPdfLineLimit,
  resolveDiaryCommentPdfRenderLayout,
  splitDiaryCommentPdfFixedWidthLines,
} from "@/lib/journal/diaryCommentPdfWrap";

const SAMPLE =
  "「7」の静けさが、人との時間を少し深くしてくれる日。たくさん話さなくても、同じ空間にいるだけで伝わるものがあったかもしれません。静かなつながりも、ちゃんと心に届いています。今日は「7」の流れに、日付の7の響きも重なる日。手ごたえや現実的な力が、いつもよりはっきり感じられそうです。";

const OWL_CLIP_SAMPLE =
  "誰かのためになる挑戦だったり、周りとの関係を深める経験だったかもしれません。新しいことの中にも、あたたかい意味が宿っています。今月は、いつもと違う選択や小さな変化が入りやすい時期です。";

describe("splitDiaryCommentPdfFixedWidthLines", () => {
  it("splits at 22 chars by default", () => {
    const lines = splitDiaryCommentPdfFixedWidthLines("あ".repeat(50));
    expect(lines).toEqual(["あ".repeat(22), "あ".repeat(22), "あ".repeat(6)]);
  });

  it("pulls back one char when next line would start with punctuation", () => {
    const text = `${"あ".repeat(21)}。${"い".repeat(10)}`;
    const lines = splitDiaryCommentPdfFixedWidthLines(text);
    expect(lines[0]).toBe(`${"あ".repeat(21)}。`);
    expect(lines[1]).toBe("い".repeat(10));
  });

  it("pulls back one char when next line would start with small kana", () => {
    const text = `${"あ".repeat(21)}っ${"い".repeat(10)}`;
    const lines = splitDiaryCommentPdfFixedWidthLines(text);
    expect(lines[0]).toBe(`${"あ".repeat(21)}っ`);
    expect(lines[1]).toBe("い".repeat(10));
  });

  it("keeps full sample text without truncation", () => {
    const lines = getDiaryCommentPdfLinesForBinding(SAMPLE);
    expect(lines.join("")).toBe(SAMPLE);
    expect(lines.every((line) => line.length <= DIARY_COMMENT_PDF_CHARS_PER_LINE)).toBe(true);
    expect(lines.some((line) => /^[、。っゃゅょぁー]/.test(line))).toBe(false);
    expect(isDiaryCommentOverPdfLineLimit(SAMPLE)).toBe(false);
  });

  it("resolves layout without dropping text", () => {
    const layout = resolveDiaryCommentPdfRenderLayout(SAMPLE);
    expect(layout.lines.join("")).toBe(SAMPLE);
    expect(layout.overflows).toBe(false);
  });

  it("keeps owl comment sample intact and within line width", () => {
    const lines = getDiaryCommentPdfLinesForBinding(OWL_CLIP_SAMPLE);
    expect(lines.join("")).toBe(OWL_CLIP_SAMPLE);
    expect(lines.every((line) => line.length <= DIARY_COMMENT_PDF_CHARS_PER_LINE)).toBe(true);
    expect(lines.some((line) => line.endsWith("深"))).toBe(false);
    expect(resolveDiaryCommentPdfRenderLayout(OWL_CLIP_SAMPLE).overflows).toBe(false);
  });
});
