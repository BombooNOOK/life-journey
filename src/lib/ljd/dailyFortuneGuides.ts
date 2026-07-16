import {
  DAILY_FORTUNE_GUIDE_SRC,
  type DailyFortuneGuideId,
} from "@/lib/ljd/dailyFortuneAssets";

export type DailyFortuneGuide = {
  id: DailyFortuneGuideId;
  name: string;
  imageSrc: string;
};

export const DAILY_FORTUNE_GUIDES: readonly DailyFortuneGuide[] = [
  { id: "owl", name: "フクロウ先生", imageSrc: DAILY_FORTUNE_GUIDE_SRC.owl },
  { id: "hedgehog", name: "ハリネズミくん", imageSrc: DAILY_FORTUNE_GUIDE_SRC.hedgehog },
  { id: "squirrel", name: "リスくん", imageSrc: DAILY_FORTUNE_GUIDE_SRC.squirrel },
  { id: "kerosion", name: "ケロシオン", imageSrc: DAILY_FORTUNE_GUIDE_SRC.kerosion },
  { id: "sloth", name: "ナマケモノくん", imageSrc: DAILY_FORTUNE_GUIDE_SRC.sloth },
] as const;

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * 同じ日・同じユーザー・同じプロフィールでは届け役を固定。
 * 鑑定内容には使わない（演出専用）。
 */
export function pickDailyFortuneGuide(input: {
  email: string;
  profileId: string;
  dateKey: string;
}): DailyFortuneGuide {
  const seed = `${input.email.trim().toLowerCase()}\0${input.profileId}\0${input.dateKey}`;
  const index = hashSeed(seed) % DAILY_FORTUNE_GUIDES.length;
  return DAILY_FORTUNE_GUIDES[index] ?? DAILY_FORTUNE_GUIDES[0];
}
