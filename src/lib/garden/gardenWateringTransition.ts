import {
  GARDEN_WATER_CAN_POSE_SRC,
  GARDEN_WATER_POURING_SRC,
} from "@/lib/garden/gardenAssets";

/** 通常 → 水 → 通常 → 水 → 通常（お水をあげてる感） */
export const GARDEN_WATERING_FX_BEATS = [
  "pose",
  "pour",
  "pose",
  "pour",
  "pose",
] as const;

export type GardenWateringFxBeat = (typeof GARDEN_WATERING_FX_BEATS)[number];

/** 1コマの表示時間（落ち着いたパッ・パッ。2秒×5だと合計約10秒でやや長い） */
export const GARDEN_WATERING_FX_BEAT_MS = 1500;

export function gardenWateringFxSrc(beat: GardenWateringFxBeat): string {
  return beat === "pour" ? GARDEN_WATER_POURING_SRC : GARDEN_WATER_CAN_POSE_SRC;
}

function preloadImage(src: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

export function preloadGardenWateringFxAssets(): Promise<void> {
  return Promise.all([
    preloadImage(GARDEN_WATER_CAN_POSE_SRC),
    preloadImage(GARDEN_WATER_POURING_SRC),
  ]).then(() => undefined);
}
