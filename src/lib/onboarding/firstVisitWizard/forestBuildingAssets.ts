/** 初回導線：森の建物単独カット（透過PNG想定） */
export const FOREST_BUILDING_SRC = {
  loghouse: "/images/ljd/first-visit/buildings/forest_building_loghouse.png",
  guideStation: "/images/ljd/first-visit/buildings/forest_building_guide_station.png",
  kanteiHall: "/images/ljd/first-visit/buildings/forest_building_kantei_hall.png",
  musicHall: "/images/ljd/first-visit/buildings/forest_building_music_hall.png",
  handicraftShop: "/images/ljd/first-visit/buildings/forest_building_handicraft_shop.png",
} as const;

export type ForestBuildingId = keyof typeof FOREST_BUILDING_SRC;
