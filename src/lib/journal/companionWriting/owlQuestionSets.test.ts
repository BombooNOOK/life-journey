import { describe, expect, it } from "vitest";

import { activityOptions } from "@/lib/journal/meta";

import {
  OWL_QUESTION_SETS,
  composeOwlGeneratedBody,
  pickOwlQuestionSet,
} from "./owlQuestionSets";

describe("owlQuestionSets", () => {
  it("18択それぞれにセットA/Bがある", () => {
    for (const option of activityOptions) {
      const sets = OWL_QUESTION_SETS.filter((s) => s.activityId === option.id);
      expect(sets).toHaveLength(2);
      expect(sets.map((s) => s.variant).sort()).toEqual(["a", "b"]);
      expect(sets.every((s) => s.dayLabel === option.label)).toBe(true);
      expect(sets.every((s) => s.q1.trim() && s.q2.trim())).toBe(true);
      expect(sets.every((s) => s.q1Placeholder.startsWith("例）"))).toBe(true);
      expect(sets.every((s) => s.q2Placeholder.startsWith("例）"))).toBe(true);
    }
  });

  it("単語・短文の回答でも不自然な助詞連結にならない", () => {
    const questionSet = OWL_QUESTION_SETS.find((s) => s.id === "new_challenge_a")!;
    const body = composeOwlGeneratedBody(questionSet, {
      answer1: "アプリを作った",
      answer2: "みんなに使ってもらいたい",
    });
    expect(body).toBe(
      "アプリを作ったという新しい一歩を踏み出した。\nそのあと、まず「みんなに使ってもらいたい」と思った。",
    );
    expect(body).not.toContain("をしたくなった");
  });

  it("各セットは answer1 / answer2 を個別の compose で合成する", () => {
    const sample = pickOwlQuestionSet("work_study");
    const body = composeOwlGeneratedBody(sample, {
      answer1: "会議の準備",
      answer2: "温かい紅茶",
    });
    expect(body).toContain("会議の準備");
    expect(body).toContain("温かい紅茶");
    expect(body).not.toContain("{answer1}");
    expect(body).not.toContain("{answer2}");
  });

  it("合成文はその日の振り返りとして過去形・感覚形の語尾になる", () => {
    const body = composeOwlGeneratedBody(
      OWL_QUESTION_SETS.find((s) => s.id === "emotional_wave_b")!,
      { answer1: "夜", answer2: "ゲッコウガのぬいぐるみ" },
    );
    expect(body).toContain("ゲッコウガのぬいぐるみ");
    expect(body).toContain("少し安心できる気がした");
    expect(body).not.toContain("安心する。");
  });
});
