import type { DailyNumberCoverVariant } from "./types";

export const DAILY_NUMBER_VARIANT_MODES = ["A", "B", "C", "random"] as const;
export type DailyNumberVariantMode = (typeof DAILY_NUMBER_VARIANT_MODES)[number];

export const DAILY_NUMBER_COVER_VARIANT_LABELS: Record<DailyNumberCoverVariant, string> = {
  A: "A 基本",
  B: "B 日常",
  C: "C 余韻",
};

export const DAILY_NUMBER_VARIANT_MODE_LABELS: Record<DailyNumberVariantMode, string> = {
  A: "A 基本",
  B: "B 日常",
  C: "C 余韻",
  random: "ランダム",
};

const COVER_VARIANTS: DailyNumberCoverVariant[] = ["A", "B", "C"];

export function isDailyNumberVariantMode(value: string): value is DailyNumberVariantMode {
  return (DAILY_NUMBER_VARIANT_MODES as readonly string[]).includes(value);
}

export function isDailyNumberCoverVariant(value: string): value is DailyNumberCoverVariant {
  return (COVER_VARIANTS as readonly string[]).includes(value);
}

export function parseDailyNumberVariantMode(
  raw: string | null | undefined,
  fallback: DailyNumberVariantMode = "A",
): DailyNumberVariantMode {
  const value = String(raw ?? "").trim();
  return isDailyNumberVariantMode(value) ? value : fallback;
}

export function pickRandomDailyNumberCoverVariant(): DailyNumberCoverVariant {
  return COVER_VARIANTS[Math.floor(Math.random() * COVER_VARIANTS.length)]!;
}

/** 表紙・個別ページで共通の resolved variant を返す */
export function resolveDailyNumberCoverVariant(input: {
  variantMode: DailyNumberVariantMode;
  lockedVariant?: DailyNumberCoverVariant | null;
}): DailyNumberCoverVariant {
  if (input.variantMode !== "random") {
    return input.variantMode;
  }
  if (input.lockedVariant && isDailyNumberCoverVariant(input.lockedVariant)) {
    return input.lockedVariant;
  }
  return pickRandomDailyNumberCoverVariant();
}

export function formatDailyNumberVariantUsageLabel(input: {
  variantMode: DailyNumberVariantMode;
  variant: DailyNumberCoverVariant;
}): string {
  if (input.variantMode === "random") {
    return `使用文体：ランダム（今回：${DAILY_NUMBER_COVER_VARIANT_LABELS[input.variant]}）`;
  }
  return `使用文体：${DAILY_NUMBER_VARIANT_MODE_LABELS[input.variantMode]}`;
}
