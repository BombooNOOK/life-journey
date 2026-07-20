import type { ForestMapSpotId } from "@/lib/help/forestMapDestinations";

/** 案内図 PNG 上のタップ領域（設計キャンバス基準・%）。画像差し替え後にここだけ調整する */
export type ForestMapHotspot = {
  id: ForestMapSpotId;
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * bamboo_nook_forest_map.png（576×1024）向け。
 * 建物は案内図1枚絵に焼き込み。調整: `/preview/forest-map/layout`
 *
 * どんぐり売店は案内図差し替え後に位置を合わせる（広めタップ）。
 */
export const FOREST_MAP_HOTSPOTS: ForestMapHotspot[] = [
  /** シアターと重ならないよう左端を少し右へ */
  { id: "loghouse", x: 28, y: 9, width: 30, height: 16 },
  { id: "forestTheater", x: 4, y: 20, width: 25, height: 18 },
  { id: "forestShop", x: 55, y: 15, width: 32, height: 17 },
  { id: "musicHall", x: 4, y: 40, width: 40, height: 16 },
  { id: "handicraftShop", x: 65, y: 33, width: 30, height: 16 },
  { id: "kanteiHall", x: 60, y: 50, width: 42, height: 20 },
  { id: "guideStation", x: 60, y: 75, width: 40, height: 20 },
  /** 案内所の道を挟んだ向かい・入口すぐ（広めタップ） */
  { id: "donguriStall", x: 14, y: 56, width: 30, height: 16 },
  { id: "forestEntrance", x: 4, y: 72, width: 30, height: 14 },
];
