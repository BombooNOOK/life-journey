import { describe, expect, it } from "vitest";

import {
  DIARY_COMMENT_PDF_CHARS_PER_LINE,
  getDiaryCommentPdfLinesForBinding,
  isDiaryCommentOverPdfLineLimit,
  resolveDiaryCommentPdfRenderLayout,
} from "@/lib/journal/diaryCommentPdfWrap";
import { DIARY_BOOK_ENTRY_COMMENT_PREVIEW_LONG_132 } from "@/lib/journal/diaryBookEntryCommentPreviewSamples";
import {
  DIARY_BOOK_ENTRY_V2_COMMENT_RENDER_OPTIONS,
} from "@/lib/journal/diaryBookEntryPrintLayout";
import {
  resolveDiaryBookEntryV2CommentRenderLayout,
} from "@/lib/journal/diaryBookEntryCommentWrap";
import { normalizeDiaryCommentForPdfFlow } from "@/lib/journal/diaryPreviewCommentLineWrap";

const SAMPLE =
  "「7」の静けさが、人との時間を少し深くしてくれる日。たくさん話さなくても、同じ空間にいるだけで伝わるものがあったかもしれません。静かなつながりも、ちゃんと心に届いています。今日は「7」の流れに、日付の7の響きも重なる日。手ごたえや現実的な力が、いつもよりはっきり感じられそうです。";

const OWL_CLIP_SAMPLE =
  "誰かのためになる挑戦だったり、周りとの関係を深める経験だったかもしれません。新しいことの中にも、あたたかい意味が宿っています。今月は、いつもと違う選択や小さな変化が入りやすい時期です。";

const SOFT_MAX = DIARY_COMMENT_PDF_CHARS_PER_LINE + 5;

function assertCommentLinesIntact(text: string) {
  const lines = getDiaryCommentPdfLinesForBinding(text);
  expect(lines.join("")).toBe(text);
  expect(lines.every((line) => line.length <= SOFT_MAX)).toBe(true);
  expect(lines.some((line) => /^[、。っゃゅょぁー]/.test(line))).toBe(false);
  expect(isDiaryCommentOverPdfLineLimit(text)).toBe(false);
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

  it("resolves production layout without dropping text", () => {
    const layout = resolveDiaryCommentPdfRenderLayout(SAMPLE, DIARY_BOOK_ENTRY_V2_COMMENT_RENDER_OPTIONS);
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

  it("fits 132-char overlap comment at full 15px without clipping", () => {
    const normalized = normalizeDiaryCommentForPdfFlow(
      DIARY_BOOK_ENTRY_COMMENT_PREVIEW_LONG_132,
    );
    const layout = resolveDiaryBookEntryV2CommentRenderLayout(normalized);
    expect(layout.lines.join("")).toBe(normalized);
    expect(layout.lines.length).toBe(5);
    expect(layout.fontScale).toBe(1);
    expect(layout.overflows).toBe(false);
    expect(layout.lines.map((line) => line.length)).toEqual([29, 29, 24, 25, 24]);
  });
});
