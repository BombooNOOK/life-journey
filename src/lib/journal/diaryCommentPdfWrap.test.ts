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

const EDGE_BREAK_SAMPLE =
  "今日はとても良い日でした。深める挑戦が続き、変化が入りやすい時期です。がんばった自分を認めて、すこやかに過ごしましょう。だからこそ、無理のない一歩を大切にしてください。";

function assertCommentLinesIntact(text: string) {
  const lines = getDiaryCommentPdfLinesForBinding(text);
  expect(lines.join("")).toBe(text);
  expect(lines.every((line) => line.length <= DIARY_COMMENT_PDF_CHARS_PER_LINE)).toBe(true);
  expect(lines.some((line) => /^[、。っゃゅょぁー]/.test(line))).toBe(false);
  expect(resolveDiaryCommentPdfRenderLayout(text).overflows).toBe(false);
}

describe("splitDiaryCommentPdfFixedWidthLines", () => {
  it("splits at 24 chars by default", () => {
    const lines = splitDiaryCommentPdfFixedWidthLines("あ".repeat(50));
    expect(lines).toEqual(["あ".repeat(24), "あ".repeat(24), "あ".repeat(2)]);
  });

  it("pulls back one char when next line would start with punctuation", () => {
    const text = `${"あ".repeat(23)}。${"い".repeat(10)}`;
    const lines = splitDiaryCommentPdfFixedWidthLines(text);
    expect(lines[0]).toBe(`${"あ".repeat(23)}。`);
    expect(lines[1]).toBe("い".repeat(10));
  });

  it("pulls back one char when next line would start with small kana", () => {
    const text = `${"あ".repeat(23)}っ${"い".repeat(10)}`;
    const lines = splitDiaryCommentPdfFixedWidthLines(text);
    expect(lines[0]).toBe(`${"あ".repeat(23)}っ`);
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

  it("keeps short owl comment intact without awkward line breaks", () => {
    assertCommentLinesIntact(OWL_CLIP_SAMPLE);
    const lines = getDiaryCommentPdfLinesForBinding(OWL_CLIP_SAMPLE);
    expect(lines.some((line) => line.endsWith("深"))).toBe(false);
    expect(lines.at(-1)).toContain("時期です。");
  });

  it("keeps long owl comment intact", () => {
    assertCommentLinesIntact(SAMPLE);
  });

  it("keeps edge-break characters intact (が・だ・め・す)", () => {
    assertCommentLinesIntact(EDGE_BREAK_SAMPLE);
    const lines = getDiaryCommentPdfLinesForBinding(EDGE_BREAK_SAMPLE);
    expect(lines.some((line) => line.endsWith("深"))).toBe(false);
    expect(lines.join("")).toContain("深める");
    expect(lines.join("")).toContain("がんばった");
    expect(lines.join("")).toContain("すこやかに");
    expect(lines.at(-1)).toContain("大切にしてください。");
  });
});
