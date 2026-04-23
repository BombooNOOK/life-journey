import type { LifePathSectionKey } from "@/lib/numerology/lifePathData";

/**
 * 横展開用テンプレ固定（まだ一括置換はしない）。
 * 1) 本質 2) 出やすさ 3) 迷い 4) 意味づけ 5) 行動ヒント 6) やさしい締め
 */
export const LIFE_PATH_SECTION_INTENT: Record<LifePathSectionKey, string> = {
  basic: "本質と土台",
  love: "愛情の向き合い方",
  work: "仕事で発揮しやすい力",
  money: "お金との関係",
  relationship: "人との距離感と信頼",
  health: "心身の整え方",
};

export const FUKUROU_PARAGRAPH_SKELETON = [
  "あなたの{sectionIntent}には、{coreTrait}が見えてきます。",
  "日々の場面では、{howItAppears}として表れやすいのではないでしょうか。",
  "一方で、{possibleWorry}と感じる時期もあるかもしれません。",
  "そう感じる瞬間そのものが、{meaningFrame}を教えてくれているのかもしれません。",
  "今のあなたにとっては、まず{smallAction}を大切にしてみるとよいでしょう。",
  "急がなくても大丈夫です。{gentleClosing}",
] as const;

export interface FukurouDraftInput {
  sectionKey: LifePathSectionKey;
  coreTrait: string;
  howItAppears: string;
  possibleWorry: string;
  meaningFrame: string;
  smallAction: string;
  gentleClosing: string;
}

/**
 * 試作用: セクションの要点を埋めると、フクロウ先生トーンの段落骨子を返す。
 */
export function buildFukurouDraftParagraphs(input: FukurouDraftInput): string[] {
  const sectionIntent = LIFE_PATH_SECTION_INTENT[input.sectionKey];
  return FUKUROU_PARAGRAPH_SKELETON.map((tmpl) =>
    tmpl
      .replace("{sectionIntent}", sectionIntent)
      .replace("{coreTrait}", input.coreTrait)
      .replace("{howItAppears}", input.howItAppears)
      .replace("{possibleWorry}", input.possibleWorry)
      .replace("{meaningFrame}", input.meaningFrame)
      .replace("{smallAction}", input.smallAction)
      .replace("{gentleClosing}", input.gentleClosing),
  );
}

/**
 * 一括整形ルール（次フェーズで実行）
 */
export const LIFE_PATH_BATCH_REWRITE_RULES = [
  "元の意味（事実・論点・注意点）を削らない",
  "強い断定は、推量・提案に置き換える（〜でしょう / 〜かもしれません）",
  "説明口調の連続を、語りかけ文と意味づけ文に分散する",
  "不安の指摘は必ず『意味づけ』と『小さな行動ヒント』を続ける",
  "1セクションの最後は『急がなくても大丈夫です』系で静かに締める",
] as const;
