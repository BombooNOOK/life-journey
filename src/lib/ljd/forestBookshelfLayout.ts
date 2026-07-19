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
  plant: { left: 2, top: 10, width: 22, height: 14.5 },
  /** 天板右：ランタン */
  lanternShelf: { left: 76, top: 9.5, width: 22, height: 14.5 },
  /** 1段目：鑑定書 */
  kanteiCover: { left: 4, top: 39, width: 34, height: 14.5 },
  spinesFortune: { left: 35.5, top: 31.5, width: 60.5, height: 30.5 },
  /** 2段目：あしあとブック */
  createDiary: { left: 2.5, top: 56.5, width: 42, height: 22 },
  currentDiary: { left: 36.5, top: 62.5, width: 30, height: 14.5 },
  placeholderRed: { left: 61.5, top: 61.5, width: 37.5, height: 17 },
  /** 3段目：これまでのあしあとブック */
  placeholderGreen: { left: 2.5, top: 82, width: 36, height: 16 },
  spinesDiary: { left: 24.5, top: 71.5, width: 56, height: 34 },
  owl: { left: 73, top: 80, width: 29.5, height: 17 },
  /** 非表示（アップ構図では床が出ない） */
  lanternFloor: { left: 0, top: 0, width: 1, height: 1 },
};

/** タップ領域は見た目より少し広め */
export const FOREST_BOOKSHELF_SPOT_LAYOUT: Record<ForestBookshelfSpotId, ForestBookshelfRect> = {
  kanteiCover: { left: 2, top: 19, width: 38, height: 22 },
  spinesFortune: { left: 34.5, top: 13, width: 68, height: 36 },
  createDiary: { left: -3.5, top: 34, width: 45.5, height: 38.5 },
  currentDiary: { left: 34.5, top: 49.5, width: 34, height: 22 },
  placeholderRed: { left: 64, top: 40, width: 41, height: 33 },
  placeholderGreen: { left: -3.5, top: 73.5, width: 40, height: 25 },
  spinesDiary: { left: 21.5, top: 67, width: 60, height: 39 },
};
