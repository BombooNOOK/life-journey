/** お庭 MVP — 成長・水やりの定数と表示ロジック */

/** 満開・完成に必要な水やり回数（これ以上は増やさない） */
export const GARDEN_WATER_GOAL = 28 as const;
export const GARDEN_STAGE_COUNT = 10 as const;

export const GARDEN_DEFAULT_SEED_TYPE = "default" as const;

export type GardenGrowthStage = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/**
 * 累計水やり回数 → 成長段階（1〜10）
 * 0〜2:1 / 3〜5:2 / … / 24〜27:9 / 28〜:10
 */
export function gardenStageFromWaterCount(waterCount: number): GardenGrowthStage {
  const n = Math.max(0, Math.floor(waterCount));
  if (n <= 2) return 1;
  if (n <= 5) return 2;
  if (n <= 8) return 3;
  if (n <= 11) return 4;
  if (n <= 14) return 5;
  if (n <= 17) return 6;
  if (n <= 20) return 7;
  if (n <= 23) return 8;
  if (n <= 27) return 9;
  return 10;
}

export function isGardenPlantComplete(waterCount: number, completedAt?: Date | string | null): boolean {
  if (completedAt) return true;
  return waterCount >= GARDEN_WATER_GOAL;
}

export function canWaterGardenToday(params: {
  waterCount: number;
  lastWateredOn: string | null | undefined;
  todayKey: string;
  completedAt?: Date | string | null;
}): boolean {
  if (isGardenPlantComplete(params.waterCount, params.completedAt)) return false;
  if (params.lastWateredOn === params.todayKey) return false;
  return true;
}

/** 同じ日・同じ鉢ではコメントが揺れないようにする */
export function pickGardenComment(comments: readonly string[], seed: string): string {
  if (comments.length === 0) return "";
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return comments[hash % comments.length] ?? comments[0]!;
}
