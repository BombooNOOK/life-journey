/** BambooNOOKの森・案内図（単独ページ用・1枚絵） */

import type { LogHouseRoomTimeOfDay } from "@/lib/loghouse/logHouseRoomTimeTheme";

export const FOREST_MAP_ASSET_DIR = "/images/ljd/forest-map" as const;

const FOREST_MAP_ASSET_VERSION = 3;

function forestMapAsset(filename: string): string {
  return `${FOREST_MAP_ASSET_DIR}/${filename}?v=${FOREST_MAP_ASSET_VERSION}`;
}

/**
 * 案内図本体（昼）。
 * ファイル: `public/images/ljd/forest-map/bamboo_nook_forest_map.png`
 */
export const FOREST_MAP_SRC = forestMapAsset("bamboo_nook_forest_map.png");

/** 案内図本体（夜） */
export const FOREST_MAP_NIGHT_SRC = forestMapAsset("bamboo_nook_forest_map_night.png");

/** 時間帯 → 案内図（ログハウス室内と同じ切替） */
export const FOREST_MAP_SRC_BY_TIME: Record<LogHouseRoomTimeOfDay, string> = {
  day: FOREST_MAP_SRC,
  night: FOREST_MAP_NIGHT_SRC,
};

/**
 * 書き出し元の実ピクセル（画像差し替え後に合わせて更新）。
 * 仮: 縦長スマホ想定。実寸が分かったらここを直す。
 */
export const FOREST_MAP_INTRINSIC = {
  widthPx: 576,
  heightPx: 1024,
} as const;

export const FOREST_MAP_PAGE_PATH = "/help/forest-map" as const;
export const FOREST_MAP_PAGE_TITLE = "BambooNOOKの森 案内図" as const;
export const FOREST_MAP_PAGE_DESCRIPTION =
  "BambooNOOKの森の案内図です。建物をタップすると、その場所へ移動できます。" as const;

export function isForestMapImmersivePath(pathname: string | null): boolean {
  return pathname === FOREST_MAP_PAGE_PATH;
}
