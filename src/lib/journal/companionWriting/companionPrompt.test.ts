import { describe, expect, it } from "vitest";

import {
  assertCompanionPromptPartsComplete,
  buildCompanionAcknowledgmentLine,
  pickCompanionShortLine,
} from "./companionPrompt";

describe("companionPrompt", () => {
  it("18択×5気分×案内役の部品が揃っている", () => {
    expect(() => assertCompanionPromptPartsComplete()).not.toThrow();
  });

  it("画面上の受け止め文を組み立てる", () => {
    expect(buildCompanionAcknowledgmentLine("calm", "record_anyway")).toBe(
      "なんとなく過ぎた一日を、おだやかな気分で振り返っているんですね。",
    );
  });

  it("案内役ごとの短い一言を選ぶ", () => {
    const line = pickCompanionShortLine("squirrel", "calm", "record_anyway");
    expect([
      "小さなできごとを、ひとつ拾ってみよう",
      "今日の中で、きらっとした場面はあったかな",
      "覚えておきたいことを、ひとつだけ持って帰ろう",
    ]).toContain(line);
  });

  it("同じ入力なら同じ短い一言を返す", () => {
    const first = pickCompanionShortLine("owl", "tired", "work_study");
    const second = pickCompanionShortLine("owl", "tired", "work_study");
    expect(first).toBe(second);
  });
});
