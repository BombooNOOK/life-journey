import { describe, expect, it } from "vitest";

import { buildCompanionWritingEntryContent } from "./buildEntryContent";

const reading = "今日は、ゆっくり休むことが大切な日です。";
const answer = "気を張りすぎていた。\n明日は自分のペースを大事にしたい。";

describe("buildCompanionWritingEntryContent", () => {
  it("近く感じた：読み解きを残し、否定しない", () => {
    const content = buildCompanionWritingEntryContent({
      mood: "tired",
      feedback: "perfect_fit",
      readingFirstSentence: reading,
      userAnswer: answer,
    });

    expect(content).toContain("今日は、つかれた気分。");
    expect(content).toContain("今日の数字から届いたことば：");
    expect(content).toContain(`「${reading}」`);
    expect(content).toContain("このことばは、今日の自分に近く感じた。");
    expect(content).not.toMatch(/外れた|ちがった|否定/);
    expect(content).toContain("自分のペースを大事にしたい。");
  });

  it("少し響いた", () => {
    const content = buildCompanionWritingEntryContent({
      mood: "calm",
      feedback: "somewhat",
      readingFirstSentence: reading,
      userAnswer: answer,
    });

    expect(content).toContain("すべてではないけれど、少し心に残るところがあった。");
  });

  it("今は少しちがう：読み解きは残し、自分の一日も書く", () => {
    const content = buildCompanionWritingEntryContent({
      mood: "normal",
      feedback: "different",
      readingFirstSentence: reading,
      userAnswer: answer,
    });

    expect(content).toContain(`「${reading}」`);
    expect(content).toContain("今の自分には、少し違うように感じた。");
    expect(content).toContain("でも、こういう見方もあるのかもしれない。");
    expect(content).toContain("今日は、自分ではこんな一日だった気がする。");
    expect(content).not.toContain("外れた");
  });

  it("まだわからない", () => {
    const content = buildCompanionWritingEntryContent({
      mood: "moody",
      feedback: "unsure",
      readingFirstSentence: reading,
      userAnswer: answer,
    });

    expect(content).toContain("今はまだ、このことばが自分に近いかどうかはわからない。");
    expect(content).toContain("あとから読み返したときに、響き方が変わるかもしれない。");
  });

  it("未鑑定などで読み解きが無いときは、読み解きブロックを省く", () => {
    const content = buildCompanionWritingEntryContent({
      mood: "happy",
      feedback: "somewhat",
      readingFirstSentence: null,
      userAnswer: answer,
    });

    expect(content).not.toContain("今日の数字から届いたことば");
    expect(content).toContain("すべてではないけれど、少し心に残るところがあった。");
  });
});
