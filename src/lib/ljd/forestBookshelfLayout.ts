/**
 * 森の本棚 — パーツ配置（%）
 * 基準: bookshelf_main.png（576×1024）の棚板
 * （見本 sample は構図参考。本番描画の本体は main）
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
  /** 1段目：棚板上（看板左右） — 下端 ≈ 27.5% */
  plant: { left: 7, top: 12.5, width: 22, height: 15 },
  lanternShelf: { left: 70, top: 12.5, width: 20, height: 15 },
  /** 2段目：鑑定書 — 下端 ≈ 44.0% */
  kanteiCover: { left: 12, top: 28.5, width: 24, height: 15.5 },
  spinesFortune: { left: 52, top: 30.5, width: 36, height: 13.5 },
  /** 3段目：日記ブック — 下端 ≈ 62.5% */
  createDiary: { left: 6, top: 46.2, width: 28, height: 16.3 },
  currentDiary: { left: 36, top: 47.2, width: 24, height: 15.3 },
  placeholderRed: { left: 62, top: 47.2, width: 26, height: 15.3 },
  /** 4段目：これまでの日記ブック — 下端 ≈ 78.0% */
  placeholderGreen: { left: 8, top: 63.5, width: 26, height: 14.5 },
  spinesDiary: { left: 37, top: 65.2, width: 30, height: 12.8 },
  owl: { left: 68, top: 63.5, width: 24, height: 14.5 },
  /** 本棚枠の外側・左下（シーン相対）。本体より前面に重ねる */
  lanternFloor: { left: -6, top: 76.5, width: 32, height: 20 },
};

/** タップ領域は見た目より少し広め */
export const FOREST_BOOKSHELF_SPOT_LAYOUT: Record<ForestBookshelfSpotId, ForestBookshelfRect> = {
  kanteiCover: { left: 10, top: 27.8, width: 28, height: 17 },
  spinesFortune: { left: 50, top: 29.8, width: 40, height: 15 },
  createDiary: { left: 4.5, top: 45.5, width: 31, height: 18 },
  currentDiary: { left: 34, top: 46.5, width: 28, height: 17 },
  placeholderRed: { left: 60, top: 46.5, width: 30, height: 17 },
  placeholderGreen: { left: 6, top: 62.8, width: 30, height: 16 },
  spinesDiary: { left: 35, top: 64.5, width: 34, height: 14.5 },
};
