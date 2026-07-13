import { GARDEN_DEFAULT_SEED_TYPE, type GardenGrowthStage } from "@/lib/garden/gardenGrowth";

export const GARDEN_ASSET_DIR = "/images/ljd/garden" as const;

const GARDEN_ASSET_VERSION = 3;

function gardenAsset(filename: string): string {
  return `${GARDEN_ASSET_DIR}/${filename}?v=${GARDEN_ASSET_VERSION}`;
}

/** ジョウロ（水やり・没入UI） */
export const GARDEN_WATERING_CAN_SRC = gardenAsset("garden_watering_can.png");

/** おでかけ行き先アイコン */
export const GARDEN_DESTINATION_ICON_SRC = gardenAsset("garden_destination_icon.png");

/** お庭背景（ユーザー提供名: garden.png） */
export const GARDEN_BG_SRC = gardenAsset("garden.png");

/** 背景の設計サイズ（ログハウス室内と同じ縦長） */
export const GARDEN_BG_INTRINSIC = { widthPx: 576, heightPx: 1024 } as const;

export function gardenPlantStageSrc(
  stage: GardenGrowthStage,
  seedType: string = GARDEN_DEFAULT_SEED_TYPE,
): string {
  const padded = String(stage).padStart(2, "0");
  return gardenAsset(`plant_${seedType}_stage_${padded}.png`);
}
