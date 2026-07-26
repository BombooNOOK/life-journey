/**
 * 森ログカード用の別入力欄（あしあと本文・読み解きに依存しない）
 */

import {
  MORI_ASHIATO_TEMPLATE_IDS,
  type MoriAshiatoTemplateId,
} from "@/lib/journal/social-post-image/moriAshiatoTemplates";
import { normalizeSocialPostText } from "@/lib/journal/social-post-image/textExtract";

export type MoriLogCardFieldKind =
  | "subjectName"
  | "ageOrStage"
  | "place"
  | "cardTitle"
  | "hitokoto";

export type MoriLogCardTextSlot = "title" | "body" | "comment";

export type MoriLogCardFieldDef = {
  kind: MoriLogCardFieldKind;
  label: string;
  placeholder: string;
  hint?: string;
  slot: MoriLogCardTextSlot;
  maxChars: number;
};

export type MoriLogCardFieldValues = Partial<Record<MoriLogCardFieldKind, string>>;

export const MORI_LOG_CARD_FIELDS_BY_TEMPLATE: Record<
  MoriAshiatoTemplateId,
  readonly MoriLogCardFieldDef[]
> = {
  chiisana_ashiato: [
    {
      kind: "subjectName",
      label: "名前",
      placeholder: "モグ",
      hint: "ペットや子どもの名前など（任意）",
      slot: "title",
      maxChars: 16,
    },
    {
      kind: "ageOrStage",
      label: "歳など",
      placeholder: "3歳 / 2歳半",
      hint: "歳・月齢・学年など、書きやすい形で（任意）",
      slot: "body",
      maxChars: 18,
    },
    {
      kind: "hitokoto",
      label: "ひとこと",
      placeholder: "きょうのちいさなできごと",
      slot: "comment",
      maxChars: 36,
    },
  ],
  kyou_no_ashiato: [
    {
      kind: "cardTitle",
      label: "タイトル",
      placeholder: "きょうのひとこま",
      slot: "title",
      maxChars: 16,
    },
    {
      kind: "hitokoto",
      label: "ひとこと",
      placeholder: "短いメモや気持ち",
      slot: "comment",
      maxChars: 36,
    },
  ],
  odekake_ashiato: [
    {
      kind: "place",
      label: "場所",
      placeholder: "○○公園",
      hint: "おでかけ先",
      slot: "title",
      maxChars: 16,
    },
    {
      kind: "hitokoto",
      label: "ひとこと",
      placeholder: "たのしかったこと",
      slot: "comment",
      maxChars: 18,
    },
  ],
  oishii_ashiato: [
    {
      kind: "place",
      label: "場所・お店",
      placeholder: "おうちごはん / ○○カフェ",
      hint: "食べた場所やお店の名前",
      slot: "title",
      maxChars: 16,
    },
    {
      kind: "hitokoto",
      label: "ひとこと",
      placeholder: "おいしかったポイント",
      slot: "comment",
      maxChars: 18,
    },
  ],
  totteoki_no_ashiato: [
    {
      kind: "cardTitle",
      label: "タイトル",
      placeholder: "とっておきの一枚",
      slot: "title",
      maxChars: 14,
    },
  ],
  kyou_no_ashiato_wide: [
    {
      kind: "hitokoto",
      label: "ひとこと",
      placeholder: "きょうのひとこと",
      slot: "comment",
      maxChars: 48,
    },
  ],
  kyou_no_3koma_ashiato: [
    {
      kind: "hitokoto",
      label: "ひとこと",
      placeholder: "3コマのメモ",
      slot: "comment",
      maxChars: 32,
    },
  ],
};

export function moriLogCardFieldsForTemplate(
  templateId: string,
): readonly MoriLogCardFieldDef[] | null {
  if (!(MORI_ASHIATO_TEMPLATE_IDS as readonly string[]).includes(templateId)) {
    return null;
  }
  return MORI_LOG_CARD_FIELDS_BY_TEMPLATE[templateId as MoriAshiatoTemplateId];
}

export function emptyMoriLogCardFieldValues(): MoriLogCardFieldValues {
  return {};
}

export function clampMoriLogCardFieldValue(raw: string, maxChars: number): string {
  return normalizeSocialPostText(raw).slice(0, maxChars);
}

/** 入力値を合成用の title / body / comment に組み立てる */
export function assembleMoriLogCardTextSlots(
  templateId: MoriAshiatoTemplateId,
  values: MoriLogCardFieldValues,
): { title: string; body: string; comment: string } {
  const fields = MORI_LOG_CARD_FIELDS_BY_TEMPLATE[templateId];
  let title = "";
  let body = "";
  let comment = "";

  for (const field of fields) {
    const raw = values[field.kind] ?? "";
    const text = clampMoriLogCardFieldValue(raw, field.maxChars);
    if (!text) continue;
    if (field.slot === "title") title = text;
    else if (field.slot === "body") body = text;
    else comment = text;
  }

  return { title, body, comment };
}

/** レイアウト定規：文字スロットに対応する入力欄（なければ null＝そのテンプレでは未使用） */
export function moriLogCardFieldForTextSlot(
  templateId: MoriAshiatoTemplateId,
  slot: MoriLogCardTextSlot,
): MoriLogCardFieldDef | null {
  return MORI_LOG_CARD_FIELDS_BY_TEMPLATE[templateId].find((f) => f.slot === slot) ?? null;
}

/** レイアウト定規で触る文字スロット（日付は別扱い） */
export function moriLogCardTextSlotsForTemplate(
  templateId: MoriAshiatoTemplateId,
): MoriLogCardTextSlot[] {
  const seen = new Set<MoriLogCardTextSlot>();
  const slots: MoriLogCardTextSlot[] = [];
  for (const field of MORI_LOG_CARD_FIELDS_BY_TEMPLATE[templateId]) {
    if (seen.has(field.slot)) continue;
    seen.add(field.slot);
    slots.push(field.slot);
  }
  return slots;
}
