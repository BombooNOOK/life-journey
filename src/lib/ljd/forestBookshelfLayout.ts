/**
 * 森の本棚 — パーツ配置（%）
 * 基準: bookshelf_main.png（576×1024）目の前アップ構図
 */

export type ForestBookshelfRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** 画像描画領域（見た目） */
export type ForestBookshelfItemId =
  | "plant"
  | "lanternShelf"
  | "kanteiCover"
  | "spinesFortune"
  | "createDiary"
  | "currentDiary"
  | "placeholderRed"
  | "placeholderGreen"
  | "spinesDiary"
  | "owl"
  | "lanternFloor";

/** タップ可能スポット */
export type ForestBookshelfSpotId =
  | "kanteiCover"
  | "spinesFortune"
  | "createDiary"
  | "currentDiary"
  | "placeholderRed"
  | "placeholderGreen"
  | "spinesDiary";

export const FOREST_BOOKSHELF_ITEM_LAYOUT: Record<ForestBookshelfItemId, ForestBookshelfRect> = {
  /** 最上段の天板付近（画面上端に少しはみ出し可） */
  plant: { left: 1, top: -1, width: 24, height: 15 },
  lanternShelf: { left: 74, top: -1, width: 24, height: 15 },
  /** 1段目：鑑定書 — 下端 ≈ 41.5% */
  kanteiCover: { left: 6, top: 16, width: 34, height: 25.5 },
  spinesFortune: { left: 46, top: 22, width: 48, height: 19.5 },
  /** 2段目：日記ブック — 下端 ≈ 72.5% */
  createDiary: { left: 3, top: 47, width: 32, height: 25.5 },
  currentDiary: { left: 34, top: 49.5, width: 30, height: 23 },
  placeholderRed: { left: 66, top: 49.5, width: 30, height: 23 },
  /** 3段目：これまでの日記ブック — 下端 ≈ 91.5% */
  placeholderGreen: { left: 5, top: 76, width: 30, height: 15.5 },
  spinesDiary: { left: 36, top: 78.5, width: 34, height: 13 },
  owl: { left: 70, top: 76, width: 28, height: 15.5 },
  /** アップ構図では床が出ないため未使用（描画側でスキップ） */
  lanternFloor: { left: 0, top: 0, width: 1, height: 1 },
};

/** タップ領域は見た目より少し広め */
export const FOREST_BOOKSHELF_SPOT_LAYOUT: Record<ForestBookshelfSpotId, ForestBookshelfRect> = {
  kanteiCover: { left: 4, top: 15, width: 38, height: 28 },
  spinesFortune: { left: 44, top: 20, width: 52, height: 23 },
  createDiary: { left: 1, top: 45.5, width: 35, height: 28 },
  currentDiary: { left: 32, top: 48, width: 34, height: 26 },
  placeholderRed: { left: 64, top: 48, width: 34, height: 26 },
  placeholderGreen: { left: 3, top: 74.5, width: 34, height: 18 },
  spinesDiary: { left: 34, top: 77, width: 38, height: 16 },
};
