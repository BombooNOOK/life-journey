import { describe, expect, it } from "vitest";

import {
  assembleMoriLogCardTextSlots,
  moriLogCardFieldForTextSlot,
  moriLogCardFieldsForTemplate,
  moriLogCardTextSlotsForTemplate,
} from "@/lib/journal/moriLog/moriLogCardFields";

describe("moriLogCardFields", () => {
  it("returns fields for Mori templates only", () => {
    expect(moriLogCardFieldsForTemplate("odekake_ashiato")?.map((f) => f.kind)).toEqual([
      "place",
      "hitokoto",
    ]);
    expect(moriLogCardFieldsForTemplate("sns02")).toBeNull();
  });

  it("assembles slots without using diary body", () => {
    expect(
      assembleMoriLogCardTextSlots("chiisana_ashiato", {
        subjectName: "モグ",
        ageOrStage: "3歳",
        hitokoto: "きょうも元気",
      }),
    ).toEqual({
      title: "モグ",
      body: "3歳",
      comment: "きょうも元気",
    });

    expect(
      assembleMoriLogCardTextSlots("odekake_ashiato", {
        place: "近所の公園",
        hitokoto: "ひなたぼっこ",
      }),
    ).toEqual({
      title: "近所の公園",
      body: "",
      comment: "ひなたぼっこ",
    });
  });

  it("maps layout slots to card field labels for the ruler", () => {
    expect(moriLogCardTextSlotsForTemplate("chiisana_ashiato")).toEqual([
      "title",
      "body",
      "comment",
    ]);
    expect(moriLogCardFieldForTextSlot("chiisana_ashiato", "title")?.label).toBe("名前");
    expect(moriLogCardFieldForTextSlot("chiisana_ashiato", "body")?.label).toBe("歳など");
    expect(moriLogCardFieldForTextSlot("odekake_ashiato", "title")?.label).toBe("場所");
    expect(moriLogCardFieldForTextSlot("kyou_no_ashiato", "body")).toBeNull();
  });
});
