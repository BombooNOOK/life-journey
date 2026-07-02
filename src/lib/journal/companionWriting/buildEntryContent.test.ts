import { describe, expect, it } from "vitest";

import { buildCompanionWritingEntryContent } from "./buildEntryContent";

describe("buildCompanionWritingEntryContent", () => {
  it("気分・鑑定士のことば・フィードバック・問い・回答を自然な日記文にまとめる", () => {
    const content = buildCompanionWritingEntryContent({
      mood: "tired",
      companionType: "owl",
      openingMessage: "つかれた日も、ここに一行残せば十分です。",
      feedback: "somewhat",
      followUpQuestion: "今日、ひとつだけ置いていきたいものはありますか？",
      userAnswer:
        "気を張りすぎていたことを思い出した。\n\n今日は人に合わせることが多くて、少し疲れた。\n明日は少しだけ、自分のペースを大事にしたい。",
    });

    expect(content).toContain("今日は、つかれた気分。");
    expect(content).toContain("フクロウ先生は、こういってくれた。");
    expect(content).toContain("そのことばは「少し響いた」。");
    expect(content).toContain("今日、ひとつだけ置いていきたいものはありますか？");
    expect(content).toContain("自分のペースを大事にしたい。");
  });
});
