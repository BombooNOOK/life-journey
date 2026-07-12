/** BambooNOOKの森の案内図（案内所・縦長スマホ構図を PC でも共用） */

const BAMBOO_FOREST_GUIDE_MAP_ASSET_VERSION = 2;

/** 旧画風・建物配置は単独案内図（`forestMapHotspots`）と同じ */
export const BAMBOO_FOREST_GUIDE_MAP_SRC =
  `/images/ljd/first-visit/forest-guide/forest_guide_map_mobile.png?v=${BAMBOO_FOREST_GUIDE_MAP_ASSET_VERSION}` as const;

export const BAMBOO_FOREST_GUIDE_MAP_INTRINSIC = {
  widthPx: 576,
  heightPx: 1024,
} as const;

export function bambooForestGuideMapSrc(): string {
  return BAMBOO_FOREST_GUIDE_MAP_SRC;
}
