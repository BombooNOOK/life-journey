/** モバイル没入お庭 — 配置（576×1024 設計・%） */

/** 草地の中央付近に鉢を置く */
export const GARDEN_MOBILE_PLANT_PLACEMENT = {
  x: 28,
  y: 48,
  width: 52,
  height: 34,
} as const;

/** 植木鉢の左寄り・やや下（鉢の近く） */
export const GARDEN_MOBILE_WATERING_CAN_PLACEMENT = {
  x: 8,
  y: 62,
  width: 28,
  height: 15,
} as const;

/** 完成花を飾るスロット（1〜3） */
export const GARDEN_MOBILE_DISPLAY_SLOT_PLACEMENTS = [
  { slotIndex: 1, x: 4, y: 36, width: 22, height: 16 },
  { slotIndex: 2, x: 74, y: 38, width: 22, height: 16 },
  { slotIndex: 3, x: 72, y: 58, width: 22, height: 15 },
] as const;
