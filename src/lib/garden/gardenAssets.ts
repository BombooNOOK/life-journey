import { GARDEN_DEFAULT_SEED_TYPE, type GardenGrowthStage } from "@/lib/garden/gardenGrowth";
import type { LogHouseRoomTimeOfDay } from "@/lib/loghouse/logHouseRoomTimeTheme";

export const GARDEN_ASSET_DIR = "/images/ljd/garden" as const;

const GARDEN_ASSET_VERSION = 5;

function gardenAsset(filename: string): string {
  return `${GARDEN_ASSET_DIR}/${filename}?v=${GARDEN_ASSET_VERSION}`;
}

/** ジョウロ（水やり・没入UI） */
export const GARDEN_WATERING_CAN_SRC = gardenAsset("garden_watering_can.png");

/** 水やり演出：通常ポーズ */
export const GARDEN_WATER_CAN_POSE_SRC = gardenAsset("garden_water_can_pose.png");

/** 水やり演出：お水が出ている */
export const GARDEN_WATER_POURING_SRC = gardenAsset("garden_water_pouring.png");

/** おでかけ行き先アイコン */
export const GARDEN_DESTINATION_ICON_SRC = gardenAsset("garden_destination_icon.png");

/** お庭背景（昼・既定） */
export const GARDEN_BG_SRC = gardenAsset("garden.png");

/** お庭背景（夜） */
export const GARDEN_BG_NIGHT_SRC = gardenAsset("garden_night.png");

/** 時間帯 → お庭背景（ログハウス室内と同じ切替） */
export const GARDEN_BG_BY_TIME: Record<LogHouseRoomTimeOfDay, string> = {
  day: GARDEN_BG_SRC,
  night: GARDEN_BG_NIGHT_SRC,
};

/** 背景の設計サイズ（ログハウス室内と同じ縦長） */
export const GARDEN_BG_INTRINSIC = { widthPx: 576, heightPx: 1024 } as const;

export function gardenPlantStageSrc(
  stage: GardenGrowthStage,
  seedType: string = GARDEN_DEFAULT_SEED_TYPE,
): string {
  const padded = String(stage).padStart(2, "0");
  return gardenAsset(`plant_${seedType}_stage_${padded}.png`);
}
