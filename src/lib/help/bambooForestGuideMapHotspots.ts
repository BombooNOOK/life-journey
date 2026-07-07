import type { FirstVisitWelcomeViewport } from "@/lib/onboarding/firstVisitWizard/welcomeAssets";

import type { ForestGuideMapBuildingId } from "@/lib/help/bambooForestGuideMapBuildings";

/** 案内図 PNG 上のタップ領域（設計キャンバス基準・%） */
export type ForestGuideMapHotspot = {
  id: ForestGuideMapBuildingId;
  x: number;
  y: number;
  width: number;
  height: number;
};

/** モバイル 576×1024 */
const MOBILE_HOTSPOTS: ForestGuideMapHotspot[] = [
  { id: "guideStation", x: 56, y: 72, width: 38, height: 15 },
  { id: "musicHall", x: 6, y: 52, width: 40, height: 17 },
  { id: "kanteiHall", x: 54, y: 34, width: 40, height: 16 },
  { id: "loghouse", x: 6, y: 18, width: 38, height: 15 },
  { id: "handicraftShop", x: 56, y: 7, width: 38, height: 15 },
];

/** デスクトップ 1024×576 */
const DESKTOP_HOTSPOTS: ForestGuideMapHotspot[] = [
  { id: "loghouse", x: 8, y: 10, width: 24, height: 42 },
  { id: "handicraftShop", x: 57, y: 8, width: 22, height: 40 },
  { id: "kanteiHall", x: 71, y: 22, width: 24, height: 36 },
  { id: "musicHall", x: 8, y: 50, width: 26, height: 42 },
  { id: "guideStation", x: 63, y: 52, width: 26, height: 40 },
];

export function forestGuideMapHotspots(viewport: FirstVisitWelcomeViewport): ForestGuideMapHotspot[] {
  return viewport === "desktop" ? DESKTOP_HOTSPOTS : MOBILE_HOTSPOTS;
}
