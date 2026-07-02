import { describe, expect, it } from "vitest";

import { buildCompanionWritingEntryContent } from "./buildEntryContent";

const answer = "公園でベンチに座って、木漏れ日を眺めていた。";

describe("buildCompanionWritingEntryContent", () => {
  it("気分・18択・案内役の一言・ユーザー入力を保存本文に残す", () => {
    const content = buildCompanionWritingEntryContent({
      mood: "calm",
      activity: "family_friends",
      companionName: "リスくん",
      companionShortLine: "小さなできごとを、ひとつ拾ってみよう",
      userAnswer: answer,
    });

    expect(content).toContain("今日は、おだやか気分。");
    expect(content).toContain("「家族・友人と過ごした」として残したい一日。");
    expect(content).toContain("リスくんに「小さなできごとを、ひとつ拾ってみよう」と言われた。");
    expect(content).toContain(answer);
    expect(content).not.toContain("振り返っているんですね");
    expect(content).not.toContain("読み解き");
  });

  it("特別なことはない日でも保存できる", () => {
    const content = buildCompanionWritingEntryContent({
      mood: "normal",
      activity: "record_anyway",
      companionName: "フクロウ先生",
      companionShortLine: "答えを急がず、今の気持ちをそっと置いてみましょう",
      userAnswer: "なんとなく穏やかだった。",
    });

    expect(content).toContain("「特別なことはないけれど、記録したい」として残したい一日。");
    expect(content).toContain("フクロウ先生に「答えを急がず、今の気持ちをそっと置いてみましょう」と言われた。");
  });
});
