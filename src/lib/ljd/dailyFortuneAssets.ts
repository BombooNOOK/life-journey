const BASE = "/images/ljd/daily-fortune" as const;

export const DAILY_FORTUNE_BG_SRC = `${BASE}/daily_fortune_background.png` as const;

export const DAILY_FORTUNE_BG_INTRINSIC = {
  widthPx: 1080,
  heightPx: 1920,
} as const;

export type DailyFortuneGuideId =
  | "owl"
  | "hedgehog"
  | "squirrel"
  | "kerosion"
  | "sloth";

export const DAILY_FORTUNE_GUIDE_SRC: Record<DailyFortuneGuideId, string> = {
  owl: `${BASE}/daily_guide_owl.png`,
  hedgehog: `${BASE}/daily_guide_hedgehog.png`,
  squirrel: `${BASE}/daily_guide_squirrel.png`,
  kerosion: `${BASE}/daily_guide_kerosion.png`,
  sloth: `${BASE}/daily_guide_sloth.png`,
};

export type DailyFortuneColorKey =
  | "red"
  | "orange-brown"
  | "yellow"
  | "green"
  | "blue"
  | "darkblue"
  | "purple"
  | "pink"
  | "white"
  | "silver"
  | "gold"
  | "multicolor";

export function dailyFortunePaletteSrc(key: DailyFortuneColorKey): string {
  return `${BASE}/daily_color_palette_${key}.png`;
}

export function dailyFortuneMotifSrc(key: DailyFortuneColorKey): string {
  return `${BASE}/daily_color_motif_${key}.png`;
}
