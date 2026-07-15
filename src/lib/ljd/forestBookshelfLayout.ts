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
  /** 非表示（天板装飾） */
  plant: { left: 1, top: -1, width: 24, height: 15 },
  /** 非表示（天板装飾） */
  lanternShelf: { left: 74, top: -1, width: 24, height: 15 },
  /** 1段目：鑑定書 */
  kanteiCover: { left: 4, top: 20.5, width: 34, height: 19 },
  spinesFortune: { left: 36.5, top: 14.5, width: 64, height: 33 },
  /** 2段目：日記ブック */
  createDiary: { left: -2, top: 35.5, width: 42, height: 35.5 },
  currentDiary: { left: 36.5, top: 51, width: 30, height: 19 },
  placeholderRed: { left: 66, top: 41.5, width: 37.5, height: 30 },
  /** 3段目：これまでの日記ブック */
  placeholderGreen: { left: -2, top: 75, width: 36, height: 22.5 },
  spinesDiary: { left: 23.5, top: 68.5, width: 56, height: 36 },
  owl: { left: 73, top: 80, width: 29.5, height: 17 },
  /** 非表示（床ランタン） */
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
