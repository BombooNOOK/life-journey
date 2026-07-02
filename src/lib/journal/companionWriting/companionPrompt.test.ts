import { describe, expect, it } from "vitest";

import {
  assertCompanionPromptPartsComplete,
  buildCompanionAcknowledgmentLine,
  getCompanionActivityTone,
  pickCompanionShortLine,
  resolveCompanionShortLineBucket,
} from "./companionPrompt";

describe("companionPrompt", () => {
  it("18択×5気分×案内役の部品が揃っている", () => {
    expect(() => assertCompanionPromptPartsComplete()).not.toThrow();
  });

  it("18択に tone を持たせる", () => {
    expect(getCompanionActivityTone("outing")).toBe("softPositive");
    expect(getCompanionActivityTone("hard_day")).toBe("negative");
    expect(getCompanionActivityTone("record_anyway")).toBe("neutral");
    expect(getCompanionActivityTone("work_study")).toBe("positive");
  });

  it("画面上の受け止め文を dayLabel 主役で組み立てる", () => {
    expect(buildCompanionAcknowledgmentLine("record_anyway")).toBe(
      "特別なことがなくても、残しておきたい日ってありますよね。",
    );
    expect(buildCompanionAcknowledgmentLine("outing")).toBe("おでかけの一日だったんですね。");
    expect(buildCompanionAcknowledgmentLine("emotional_wave")).toBe(
      "心がざわつくような日だったんですね。",
    );
    expect(buildCompanionAcknowledgmentLine("hard_day")).toBe(
      "しんどさを感じながら過ごした日だったんですね。",
    );
  });

  it("受け止め文は気分を復唱しない", () => {
    const line = buildCompanionAcknowledgmentLine("record_anyway");
    expect(line).not.toContain("気分");
    expect(line).not.toContain("振り返って");
  });

  it("negative の dayLabel では negative 枠から選ぶ", () => {
    expect(resolveCompanionShortLineBucket("hard_day", "calm")).toBe("negative");
    const line = pickCompanionShortLine("squirrel", "calm", "hard_day");
    expect(line).not.toContain("きらっと");
  });

  it("softPositive + つかれた では positive 枠を使わない", () => {
    expect(resolveCompanionShortLineBucket("outing", "tired")).not.toBe("positive");
    const line = pickCompanionShortLine("squirrel", "tired", "outing");
    expect(line).not.toBe("今日の中で、きらっとした場面はあったかな");
    expect(line).not.toBe("小さなできごとを、ひとつ拾ってみよう");
  });

  it("positive + うれしい では positive 枠から選べる", () => {
    expect(resolveCompanionShortLineBucket("work_study", "happy")).toBe("positive");
    const line = pickCompanionShortLine("squirrel", "happy", "work_study");
    expect([
      "小さなできごとを、ひとつ拾ってみよう",
      "今日の中で、きらっとした場面はあったかな",
    ]).toContain(line);
  });

  it("positive + つかれた では soft / neutral 枠から選ぶ", () => {
    const bucket = resolveCompanionShortLineBucket("work_study", "tired");
    expect(bucket === "soft" || bucket === "neutral").toBe(true);
  });

  it("同じ入力なら同じ短い一言を返す", () => {
    const first = pickCompanionShortLine("owl", "tired", "work_study");
    const second = pickCompanionShortLine("owl", "tired", "work_study");
    expect(first).toBe(second);
  });
});
