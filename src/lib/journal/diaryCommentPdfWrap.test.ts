import { describe, expect, it } from "vitest";

import {
  DIARY_COMMENT_PDF_CHARS_PER_LINE,
  getDiaryCommentPdfLinesForBinding,
  isDiaryCommentOverPdfLineLimit,
  resolveDiaryCommentPdfRenderLayout,
} from "@/lib/journal/diaryCommentPdfWrap";

const SAMPLE =
  "「7」の静けさが、人との時間を少し深くしてくれる日。たくさん話さなくても、同じ空間にいるだけで伝わるものがあったかもしれません。静かなつながりも、ちゃんと心に届いています。今日は「7」の流れに、日付の7の響きも重なる日。手ごたえや現実的な力が、いつもよりはっきり感じられそうです。";

const OWL_CLIP_SAMPLE =
  "誰かのためになる挑戦だったり、周りとの関係を深める経験だったかもしれません。新しいことの中にも、あたたかい意味が宿っています。今月は、いつもと違う選択や小さな変化が入りやすい時期です。";

const EDGE_BREAK_SAMPLE =
  "今日はとても良い日でした。深める挑戦が続き、変化が入りやすい時期です。がんばった自分を認めて、すこやかに過ごしましょう。だからこそ、無理のない一歩を大切にしてください。";

const SOFT_MAX = DIARY_COMMENT_PDF_CHARS_PER_LINE + 5;

function assertCommentLinesIntact(text: string) {
  const lines = getDiaryCommentPdfLinesForBinding(text);
  expect(lines.join("")).toBe(text);
  expect(lines.every((line) => line.length <= SOFT_MAX)).toBe(true);
  expect(lines.some((line) => /^[、。っゃゅょぁー]/.test(line))).toBe(false);
  expect(resolveDiaryCommentPdfRenderLayout(text).overflows).toBe(false);
}

describe("getDiaryCommentPdfLinesForBinding", () => {
  it("wraps at configured chars per line with bracket pullback", () => {
    const lines = getDiaryCommentPdfLinesForBinding("あ".repeat(70));
    expect(lines.join("")).toBe("あ".repeat(70));
    expect(lines.every((line) => line.length <= SOFT_MAX)).toBe(true);
    expect(lines.length).toBeGreaterThan(1);
  });

  it("splits at max chars without seeking punctuation early", () => {
    const text = `${"あ".repeat(DIARY_COMMENT_PDF_CHARS_PER_LINE)}。${"い".repeat(10)}`;
    const lines = getDiaryCommentPdfLinesForBinding(text);
    expect(lines[0]?.length).toBeLessThanOrEqual(DIARY_COMMENT_PDF_CHARS_PER_LINE);
    expect(lines.join("")).toBe(text);
  });

  it("does not start lines with small kana", () => {
    const text = `${"あ".repeat(DIARY_COMMENT_PDF_CHARS_PER_LINE)}っ${"い".repeat(10)}`;
    const lines = getDiaryCommentPdfLinesForBinding(text);
    expect(lines.join("")).toBe(text);
    expect(lines.some((line) => /^っ/.test(line))).toBe(false);
  });

  it("keeps full sample text without truncation", () => {
    const lines = getDiaryCommentPdfLinesForBinding(SAMPLE);
    expect(lines.join("")).toBe(SAMPLE);
    expect(lines.every((line) => line.length <= SOFT_MAX)).toBe(true);
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
    expect(lines.join("")).toContain("時期です。");
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
    expect(lines.join("")).toContain("大切にしてください。");
  });
});
