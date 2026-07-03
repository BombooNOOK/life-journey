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
    }
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
});
