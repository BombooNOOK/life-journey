import { describe, expect, it } from "vitest";

import {
  assembleMoriLogCardTextSlots,
  KYOU_NO_ASHIATO_HITOKOTO_PROMPTS,
  moriLogCardFieldForTextSlot,
  moriLogCardFieldsForTemplate,
  moriLogCardTextSlotsForTemplate,
  resolveMoriLogCardHitokotoPrompt,
} from "@/lib/journal/moriLog/moriLogCardFields";

describe("moriLogCardFields", () => {
  it("returns fields for Mori templates only", () => {
    expect(moriLogCardFieldsForTemplate("odekake_ashiato")?.map((f) => f.kind)).toEqual([
      "place",
      "hitokoto",
    ]);
    expect(moriLogCardFieldsForTemplate("sns02")).toBeNull();
  });

  it("defines kyou_no_ashiato as title, place, and prompted hitokoto", () => {
    const fields = moriLogCardFieldsForTemplate("kyou_no_ashiato");
    expect(fields?.map((f) => f.kind)).toEqual(["cardTitle", "place", "hitokoto"]);
    expect(fields?.[2]?.hitokotoPrompts?.map((p) => p.label)).toEqual([
      "ひとことメモ",
      "その時の気持ち",
      "一緒にいた人",
    ]);
  });

  it("defines totteoki_no_ashiato as title and hitokoto message", () => {
    expect(moriLogCardFieldsForTemplate("totteoki_no_ashiato")?.map((f) => f.kind)).toEqual([
      "cardTitle",
      "hitokoto",
    ]);
    expect(moriLogCardFieldForTextSlot("totteoki_no_ashiato", "title")?.maxChars).toBe(10);
    expect(moriLogCardFieldForTextSlot("totteoki_no_ashiato", "comment")?.label).toBe(
      "ひとことメッセージ",
    );
  });

  it("defines kyou_no_3koma_ashiato as panel hitokotos plus day summary", () => {
    expect(moriLogCardFieldsForTemplate("kyou_no_3koma_ashiato")?.map((f) => f.kind)).toEqual([
      "hitokoto",
      "hitokoto2",
      "hitokoto3",
      "dayHitokoto",
    ]);
    expect(moriLogCardTextSlotsForTemplate("kyou_no_3koma_ashiato")).toEqual([
      "title",
      "body",
      "comment",
      "summary",
    ]);
    expect(moriLogCardFieldForTextSlot("kyou_no_3koma_ashiato", "title")?.label).toBe(
      "1コマ目のひとこと",
    );
    expect(moriLogCardFieldForTextSlot("kyou_no_3koma_ashiato", "summary")?.label).toBe(
      "今日のひとこと",
    );
    expect(moriLogCardFieldForTextSlot("kyou_no_3koma_ashiato", "title")?.maxChars).toBe(13);
    expect(moriLogCardFieldForTextSlot("kyou_no_3koma_ashiato", "body")?.maxChars).toBe(13);
    expect(moriLogCardFieldForTextSlot("kyou_no_3koma_ashiato", "comment")?.maxChars).toBe(13);
    expect(moriLogCardFieldForTextSlot("kyou_no_3koma_ashiato", "summary")?.maxChars).toBe(15);
    expect(
      assembleMoriLogCardTextSlots("kyou_no_3koma_ashiato", {
        hitokoto: "おはよう",
        hitokoto2: "ひるやすみ",
        hitokoto3: "おやすみ",
        dayHitokoto: "きょうもいい一日",
      }),
    ).toEqual({
      title: "おはよう",
      body: "ひるやすみ",
      comment: "おやすみ",
      summary: "きょうもいい一日",
      promptLabel: "",
    });
  });

  it("defines oishii_ashiato as place, menu, and hitokoto", () => {
    expect(moriLogCardFieldsForTemplate("oishii_ashiato")?.map((f) => f.kind)).toEqual([
      "place",
      "menu",
      "hitokoto",
    ]);
    expect(moriLogCardFieldForTextSlot("oishii_ashiato", "body")?.label).toBe("メニュー");
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
      summary: "",
      promptLabel: "",
    });

    expect(
      assembleMoriLogCardTextSlots("kyou_no_ashiato", {
        cardTitle: "ひなたの午後",
        place: "ベランダ",
        hitokotoPromptId: "feeling",
        hitokoto: "ぽかぽかだった",
      }),
    ).toEqual({
      title: "ひなたの午後",
      body: "ベランダ",
      comment: "ぽかぽかだった",
      summary: "",
      promptLabel: "その時の気持ち",
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
      summary: "",
      promptLabel: "",
    });

    expect(
      assembleMoriLogCardTextSlots("oishii_ashiato", {
        place: "近所のカフェ",
        menu: "チーズケーキ",
        hitokoto: "ほっこりした",
      }),
    ).toEqual({
      title: "近所のカフェ",
      body: "チーズケーキ",
      comment: "ほっこりした",
      summary: "",
      promptLabel: "",
    });
  });

  it("resolves hitokoto prompt labels for the prompted field", () => {
    const field = moriLogCardFieldsForTemplate("kyou_no_ashiato")?.[2];
    expect(field).toBeTruthy();
    expect(resolveMoriLogCardHitokotoPrompt(field!, undefined)?.id).toBe("memo");
    expect(resolveMoriLogCardHitokotoPrompt(field!, "companions")?.label).toBe("一緒にいた人");
    expect(KYOU_NO_ASHIATO_HITOKOTO_PROMPTS).toHaveLength(3);
  });

  it("preserves newlines in two-line hitokoto fields", () => {
    const slots = assembleMoriLogCardTextSlots("chiisana_ashiato", {
      subjectName: "モグ",
      ageOrStage: "3歳",
      hitokoto: "おはよう\nおやすみ",
    });
    expect(slots.comment).toBe("おはよう\nおやすみ");
    expect(moriLogCardFieldForTextSlot("chiisana_ashiato", "comment")?.maxLines).toBe(2);
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
    expect(moriLogCardFieldForTextSlot("kyou_no_ashiato", "body")?.label).toBe("場所");
    expect(moriLogCardFieldForTextSlot("kyou_no_ashiato", "comment")?.label).toBe("メッセージ");
  });
});
