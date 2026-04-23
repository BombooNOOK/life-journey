/**
 * 入力フォーム「今いちばん関心のあること」— 候補プールは変えず、同候補内の優先度のみに使う。
 */

import { getStonePdfV4EntryById } from "./stonePdfV4Master";

export const STONE_FOCUS_THEME_NONE = "特に決まっていない" as const;

export const STONE_FOCUS_THEME_OPTIONS = [
  "夢・目標",
  "これからの人生",
  "恋愛・結婚",
  "対人関係",
  "家族",
  "仕事・使命",
  "金運・豊かさ",
  "健康・癒し",
  "厄除け・守り",
  STONE_FOCUS_THEME_NONE,
] as const;

export type StoneFocusThemeLabel = (typeof STONE_FOCUS_THEME_OPTIONS)[number];

export function isNeutralStoneFocusTheme(label: string | null | undefined): boolean {
  if (label == null || label.trim() === "") return true;
  return label === STONE_FOCUS_THEME_NONE;
}

export function normalizeStoneFocusThemeLabel(raw: unknown): StoneFocusThemeLabel {
  if (typeof raw !== "string") return STONE_FOCUS_THEME_NONE;
  const t = raw.trim();
  return (STONE_FOCUS_THEME_OPTIONS as readonly string[]).includes(t)
    ? (t as StoneFocusThemeLabel)
    : STONE_FOCUS_THEME_NONE;
}

/** 石の説明テキストに対し、関心テーマとの一致度（0 以上の整数）。大きいほど優先。 */
export function focusThemeKeywordBonus(themeLabel: string, blob: string): number {
  if (isNeutralStoneFocusTheme(themeLabel)) return 0;
  const b = blob.replace(/\s+/g, "");
  if (!b) return 0;

  const rules: Array<{ label: string; re: RegExp }> = [
    { label: "夢・目標", re: /夢|目標|希望|実現|チャレンジ|前進|成功|天職|可能性|ビジョン|野心/ },
    { label: "これからの人生", re: /人生|これから|未来|変容|新しい|扉|転機|次の|ステージ|道/ },
    { label: "恋愛・結婚", re: /恋|愛|結婚|パートナー|縁|出会い|恋人|夫婦|ロマン|情熱/ },
    { label: "対人関係", re: /対人|人間関係|調和|円滑|コミュニケーション|信頼|仲間|職場|縁/ },
    { label: "家族", re: /家族|親子|子|家庭|絆|母|父|育|守る/ },
    { label: "仕事・使命", re: /仕事|使命|天職|職業|ビジネス|キャリア|リーダー|才能|表現|創造/ },
    { label: "金運・豊かさ", re: /金運|豊か|富|繁栄|実り|商談|チャンス|ツキ|蓄え/ },
    { label: "健康・癒し", re: /健康|癒し|ヒーリング|心身|安眠|ストレス|疲労|血流|バランス|安定/ },
    { label: "厄除け・守り", re: /魔除け|厄|守り|護符|邪気|浄化|防御|安全|トラブル|災/ },
  ];

  const rule = rules.find((r) => r.label === themeLabel);
  if (!rule) return 0;

  let score = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(rule.re.source, "g");
  while ((m = re.exec(b)) !== null) {
    score += 1;
    if (score >= 8) break;
  }
  return score;
}

export function keywordBlobForStonePdfLookup(blobParts: {
  headlineKeywords: string[];
  numerologyKeywords: string[];
  tagline: string;
  featureText: string;
  powerText: string;
}): string {
  return [
    ...blobParts.headlineKeywords,
    ...blobParts.numerologyKeywords,
    blobParts.tagline,
    blobParts.featureText.slice(0, 400),
    blobParts.powerText.slice(0, 400),
  ].join("\n");
}

/** 石 id に紐づく PDF 本文・キーワードで関心テーマ一致ボーナスを算出 */
export function focusThemeBonusForStoneId(id: string, themeLabel: string): number {
  if (isNeutralStoneFocusTheme(themeLabel)) return 0;
  const e = getStonePdfV4EntryById(id);
  if (!e) return 0;
  const blob = keywordBlobForStonePdfLookup({
    headlineKeywords: e.headlineKeywords,
    numerologyKeywords: e.numerologyKeywords,
    tagline: e.tagline,
    featureText: e.featureText,
    powerText: e.powerText,
  });
  return focusThemeKeywordBonus(themeLabel, blob);
}
