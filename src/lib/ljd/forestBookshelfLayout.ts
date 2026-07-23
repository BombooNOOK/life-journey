/**
 * 森の本棚 — パーツ配置（%）
 * 基準: bookshelf_main.png（576×1024）目の前アップ構図
 * ※このファイルはレイアウト定規の「ファイルに保存」から更新できます。
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
  /** 天板左：観葉（本体天板 ≈24%） */
  plant: { left: 5, top: -6, width: 37, height: 33.5 },
  /** 天板右：ランタン */
  lanternShelf: { left: 55, top: 2, width: 38, height: 24 },
  /** 1段目：鑑定書 */
  kanteiCover: { left: 4, top: 39, width: 34, height: 14.5 },
  spinesFortune: { left: 35.5, top: 31.5, width: 60.5, height: 30.5 },
  /** 2段目：あしあとブック */
  createDiary: { left: 2.5, top: 56.5, width: 42, height: 22 },
  currentDiary: { left: 38, top: 62.5, width: 30, height: 14.5 },
  placeholderRed: { left: 63, top: 62.5, width: 30, height: 14.5 },
  /** 3段目：これまでのあしあとブック */
  placeholderGreen: { left: 2.5, top: 81.5, width: 36, height: 14.5 },
  spinesDiary: { left: 24.5, top: 71.5, width: 56, height: 34 },
  owl: { left: 71, top: 82.5, width: 29.5, height: 15.5 },
  /** 非表示（アップ構図では床が出ない） */
  lanternFloor: { left: 0, top: 0, width: 1, height: 1 },
};

/** タップ領域は見た目より少し広め */
export const FOREST_BOOKSHELF_SPOT_LAYOUT: Record<ForestBookshelfSpotId, ForestBookshelfRect> = {
  kanteiCover: { left: 9.5, top: 37.5, width: 23, height: 16.5 },
  spinesFortune: { left: 37.5, top: 37, width: 57, height: 17.5 },
  createDiary: { left: 7, top: 57.5, width: 31, height: 20.5 },
  currentDiary: { left: 40.5, top: 59.5, width: 24, height: 18.5 },
  placeholderRed: { left: 69, top: 61, width: 22.2, height: 14.5 },
  placeholderGreen: { left: 8.5, top: 82.5, width: 22, height: 14.5 },
  spinesDiary: { left: 32, top: 81.5, width: 44, height: 39 },
};
