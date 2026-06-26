export const DAILY_NUMBER_CLOSING_VARIANTS = [
  "animal_friends",
  "diary_entry",
  "one_word_diary",
  "animal_guides",
] as const;

export type DailyNumberClosingVariant = (typeof DAILY_NUMBER_CLOSING_VARIANTS)[number];

export const DAILY_NUMBER_CLOSING_VARIANT_LABELS: Record<DailyNumberClosingVariant, string> = {
  animal_friends: "どうぶつ仲間",
  diary_entry: "日記を残す",
  one_word_diary: "ひとこと日記",
  animal_guides: "どうぶつ鑑定士",
};

const CLOSING_VARIANTS: DailyNumberClosingVariant[] = [...DAILY_NUMBER_CLOSING_VARIANTS];

export function isDailyNumberClosingVariant(value: string): value is DailyNumberClosingVariant {
  return (DAILY_NUMBER_CLOSING_VARIANTS as readonly string[]).includes(value);
}

export function pickRandomDailyNumberClosingVariant(): DailyNumberClosingVariant {
  return CLOSING_VARIANTS[Math.floor(Math.random() * CLOSING_VARIANTS.length)]!;
}

/**
 * ラストページ variant を解決する。
 * 将来: 直近3投稿と同じ closingVariant が連続しないよう、履歴を渡して選別する。
 */
export function resolveDailyNumberClosingVariant(input: {
  lockedClosingVariant?: DailyNumberClosingVariant | null;
}): DailyNumberClosingVariant {
  if (input.lockedClosingVariant && isDailyNumberClosingVariant(input.lockedClosingVariant)) {
    return input.lockedClosingVariant;
  }
  return pickRandomDailyNumberClosingVariant();
}

export function formatDailyNumberClosingVariantUsageLabel(
  closingVariant: DailyNumberClosingVariant,
): string {
  return `ラストページ：ランダム（今回：${DAILY_NUMBER_CLOSING_VARIANT_LABELS[closingVariant]}）`;
}
