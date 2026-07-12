import { FOREST_MAP_HOTSPOTS, type ForestMapHotspot } from "@/lib/help/forestMapHotspots";
import type { ForestMapSpotId } from "@/lib/help/forestMapDestinations";

/** 案内所案内図のタップ領域（単独案内図と同じ %） */
export type ForestGuideMapHotspot = ForestMapHotspot;

export type ForestGuideMapSpotId = ForestMapSpotId;

/**
 * 単独案内図（`FOREST_MAP_HOTSPOTS`）と同じ配置。
 * 案内所は旧画風画像だが、建物の位置関係は最新マップと揃えている。
 */
export function forestGuideMapHotspots(): ForestGuideMapHotspot[] {
  return FOREST_MAP_HOTSPOTS;
}
