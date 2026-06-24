import { describe, expect, it } from "vitest";

import { getCompanionBaseCommentText } from "@/lib/journal/commentPersonalDayActivityByCompanion";

describe("getCompanionBaseCommentText", () => {
  it("owl は本番原稿を返す", () => {
    const text = getCompanionBaseCommentText("work_study_1_a", "owl");
    expect(text).toContain("自分から動けた日");
  });

  it("hedgehog は pending 原稿があれば owl と異なる", () => {
    const owl = getCompanionBaseCommentText("work_study_1_a", "owl");
    const hedgehog = getCompanionBaseCommentText("work_study_1_a", "hedgehog");
    expect(hedgehog).not.toBe(owl);
    expect(hedgehog).toContain("十分上出来");
  });

  it("pending にないテンプレートは owl フォールバック文にフォールバックする", () => {
    const owl = getCompanionBaseCommentText("unknown_template_1_a", "owl");
    const sloth = getCompanionBaseCommentText("unknown_template_1_a", "sloth");
    expect(owl).toContain("小さな意味");
    expect(sloth).not.toBe(owl);
    expect(sloth).toContain("明日の自分への手紙");
  });

  it("fallback_no_base_match はキャラ別", () => {
    const owl = getCompanionBaseCommentText("fallback_no_base_match", "owl");
    const hedgehog = getCompanionBaseCommentText("fallback_no_base_match", "hedgehog");
    expect(hedgehog).not.toBe(owl);
    expect(hedgehog).toContain("助けになります");
  });
});
