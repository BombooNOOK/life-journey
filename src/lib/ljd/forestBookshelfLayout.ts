/**
 * 森の本棚 — パーツ配置（%）
 * 基準: bookshelf_sample.png（576×1024）
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
  /** 1段目：棚板上（看板左右） */
  plant: { left: 8, top: 13.8, width: 20, height: 13.2 },
  lanternShelf: { left: 71, top: 13.5, width: 18.5, height: 13.5 },
  /** 2段目：鑑定書 */
  kanteiCover: { left: 11, top: 29.2, width: 24, height: 15.8 },
  spinesFortune: { left: 54, top: 30.2, width: 34, height: 14.2 },
  /** 3段目：日記ブック */
  createDiary: { left: 7, top: 47.8, width: 26.5, height: 16.5 },
  currentDiary: { left: 37, top: 48.5, width: 22.5, height: 15.8 },
  placeholderRed: { left: 63, top: 48.5, width: 24.5, height: 15.8 },
  /** 4段目：これまでの日記ブック */
  placeholderGreen: { left: 9, top: 66.2, width: 24.5, height: 15.8 },
  spinesDiary: { left: 38, top: 67, width: 28, height: 14.5 },
  owl: { left: 70, top: 66.2, width: 22, height: 15.8 },
  /** 本棚枠の外側・左下（シーン相対）。本体より前面に重ねる */
  lanternFloor: { left: -8, top: 79, width: 30, height: 19 },
};

/** タップ領域は見た目より少し広め */
export const FOREST_BOOKSHELF_SPOT_LAYOUT: Record<ForestBookshelfSpotId, ForestBookshelfRect> = {
  kanteiCover: { left: 9, top: 28.5, width: 28, height: 17.5 },
  spinesFortune: { left: 52, top: 29.5, width: 38, height: 16 },
  createDiary: { left: 5.5, top: 47.2, width: 30, height: 18 },
  currentDiary: { left: 35, top: 47.8, width: 26.5, height: 17.5 },
  placeholderRed: { left: 61, top: 47.8, width: 28.5, height: 17.5 },
  placeholderGreen: { left: 7, top: 65.5, width: 28.5, height: 17.5 },
  spinesDiary: { left: 36, top: 66.2, width: 32, height: 16 },
};
