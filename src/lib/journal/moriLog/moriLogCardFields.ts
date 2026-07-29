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
  | "menu"
  | "cardTitle"
  | "hitokoto"
  | "hitokoto2"
  | "hitokoto3"
  | "dayHitokoto";

export type MoriLogCardTextSlot = "title" | "body" | "comment" | "summary";

/** 今日のあしあと：4項目目の「なにを残すか」 */
export type MoriLogCardHitokotoPromptId = "memo" | "feeling" | "companions";

export type MoriLogCardHitokotoPrompt = {
  id: MoriLogCardHitokotoPromptId;
  label: string;
  placeholder: string;
};

export const KYOU_NO_ASHIATO_HITOKOTO_PROMPTS: readonly MoriLogCardHitokotoPrompt[] = [
  { id: "memo", label: "ひとことメモ", placeholder: "短いメモをどうぞ" },
  { id: "feeling", label: "その時の気持ち", placeholder: "そのときの気持ち" },
  { id: "companions", label: "一緒にいた人", placeholder: "だれと・だれが" },
];

export type MoriLogCardFieldDef = {
  kind: MoriLogCardFieldKind;
  label: string;
  placeholder: string;
  hint?: string;
  slot: MoriLogCardTextSlot;
  maxChars: number;
  /** 入力・描画で許可する行数（2以上なら改行可・textarea） */
  maxLines?: number;
  /** ある場合、入力前に種類を選ぶ（今日のあしあとの4項目目など） */
  hitokotoPrompts?: readonly MoriLogCardHitokotoPrompt[];
};

export type MoriLogCardFieldValues = Partial<Record<MoriLogCardFieldKind, string>> & {
  hitokotoPromptId?: MoriLogCardHitokotoPromptId;
};

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
      maxLines: 2,
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
      kind: "place",
      label: "場所",
      placeholder: "おうち / ○○公園",
      hint: "そのときの場所（任意）",
      slot: "body",
      maxChars: 18,
    },
    {
      kind: "hitokoto",
      label: "メッセージ",
      placeholder: "短いメモをどうぞ",
      hint: "上から選んでから書いてください",
      slot: "comment",
      maxChars: 36,
      maxLines: 2,
      hitokotoPrompts: KYOU_NO_ASHIATO_HITOKOTO_PROMPTS,
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
      kind: "menu",
      label: "メニュー",
      placeholder: "いちごパフェ / カレー",
      hint: "食べたもの・飲んだもの（任意）",
      slot: "body",
      maxChars: 18,
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
    {
      kind: "hitokoto",
      label: "ひとことメッセージ",
      placeholder: "この一枚へのひとこと",
      hint: "任意。カードに載せたい言葉だけどうぞ",
      slot: "comment",
      maxChars: 36,
      maxLines: 2,
    },
  ],
  kyou_no_ashiato_wide: [
    {
      kind: "hitokoto",
      label: "ひとこと",
      placeholder: "きょうのひとこと",
      slot: "comment",
      maxChars: 48,
      maxLines: 2,
    },
  ],
  kyou_no_3koma_ashiato: [
    {
      kind: "hitokoto",
      label: "1コマ目のひとこと",
      placeholder: "朝のひとこま",
      hint: "上の写真への短い言葉",
      slot: "title",
      maxChars: 13,
    },
    {
      kind: "hitokoto2",
      label: "2コマ目のひとこと",
      placeholder: "昼のひとこま",
      hint: "真ん中の写真への短い言葉",
      slot: "body",
      maxChars: 13,
    },
    {
      kind: "hitokoto3",
      label: "3コマ目のひとこと",
      placeholder: "夜のひとこま",
      hint: "下の写真への短い言葉",
      slot: "comment",
      maxChars: 13,
    },
    {
      kind: "dayHitokoto",
      label: "今日のひとこと",
      placeholder: "きょうを一言でまとめると",
      hint: "3コマ全体のおまとめ（任意）",
      slot: "summary",
      maxChars: 15,
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

/** 行内の空白は整えつつ、明示的な改行は残す */
export function normalizeMoriLogCardMultilineText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t\u3000]+/g, " ").trim())
    .join("\n")
    .replace(/^\n+|\n+$/g, "");
}

export function clampMoriLogCardFieldValue(
  raw: string,
  maxChars: number,
  maxLines = 1,
): string {
  if (maxLines <= 1) {
    return normalizeSocialPostText(raw).slice(0, maxChars);
  }
  const lines = normalizeMoriLogCardMultilineText(raw)
    .split("\n")
    .slice(0, maxLines);
  let text = lines.join("\n");
  if (text.length > maxChars) {
    text = text.slice(0, maxChars).replace(/\n+$/g, "");
  }
  return text;
}

export function resolveMoriLogCardHitokotoPrompt(
  field: MoriLogCardFieldDef,
  promptId: MoriLogCardHitokotoPromptId | undefined,
): MoriLogCardHitokotoPrompt | null {
  const prompts = field.hitokotoPrompts;
  if (!prompts?.length) return null;
  return prompts.find((p) => p.id === promptId) ?? prompts[0] ?? null;
}

/** 入力値を合成用の title / body / comment / summary / promptLabel に組み立てる */
export function assembleMoriLogCardTextSlots(
  templateId: MoriAshiatoTemplateId,
  values: MoriLogCardFieldValues,
): {
  title: string;
  body: string;
  comment: string;
  summary: string;
  promptLabel: string;
} {
  const fields = MORI_LOG_CARD_FIELDS_BY_TEMPLATE[templateId];
  let title = "";
  let body = "";
  let comment = "";
  let summary = "";
  let promptLabel = "";

  for (const field of fields) {
    if (field.hitokotoPrompts?.length) {
      const prompt = resolveMoriLogCardHitokotoPrompt(field, values.hitokotoPromptId);
      if (prompt) promptLabel = prompt.label;
    }
    const raw = values[field.kind] ?? "";
    const text = clampMoriLogCardFieldValue(raw, field.maxChars, field.maxLines ?? 1);
    if (!text) continue;
    if (field.slot === "title") title = text;
    else if (field.slot === "body") body = text;
    else if (field.slot === "summary") summary = text;
    else comment = text;
  }

  return { title, body, comment, summary, promptLabel };
}

/** レイアウト定規：文字スロットに対応する入力欄（なければ null＝そのテンプレでは未使用） */
export function moriLogCardFieldForTextSlot(
  templateId: MoriAshiatoTemplateId,
  slot: MoriLogCardTextSlot,
): MoriLogCardFieldDef | null {
  return MORI_LOG_CARD_FIELDS_BY_TEMPLATE[templateId].find((f) => f.slot === slot) ?? null;
}

/** レイアウト定規で触る文字スロット（日付・選択ラベルは別扱い） */
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

/** 今日のあしあとなど、3択ラベル枠を定規に出すか */
export function moriLogCardHasPromptLabelSlot(templateId: MoriAshiatoTemplateId): boolean {
  return MORI_LOG_CARD_FIELDS_BY_TEMPLATE[templateId].some(
    (field) => (field.hitokotoPrompts?.length ?? 0) > 0,
  );
}
