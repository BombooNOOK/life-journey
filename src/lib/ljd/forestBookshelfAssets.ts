/** 森の本棚 — アセットパス（576×1024 設計）
 *
 * 本体差し替え: `public/images/ljd/bookshelf/bookshelf_main.png` を上書きし、
 * `ASSET_VERSION` を +1 する（キャッシュ破棄）。パーツ類は別ファイルのまま。
 *
 * 上部余白は本体PNGを透明にし、`bookshelf_background.png` を下に敷く。
 */

export const FOREST_BOOKSHELF_ASSET_DIR = "/images/ljd/bookshelf" as const;
/** 本体・背景差し替え時に上げる */
const ASSET_VERSION = 10;

function asset(filename: string): string {
  return `${FOREST_BOOKSHELF_ASSET_DIR}/${filename}?v=${ASSET_VERSION}`;
}

export const FOREST_BOOKSHELF_INTRINSIC = {
  widthPx: 576,
  heightPx: 1024,
} as const;

export const FOREST_BOOKSHELF_ASSETS = {
  main: asset("bookshelf_main.png"),
  /** 上部余白・画面外に見える部屋背景 */
  background: asset("bookshelf_background.png"),
  sample: asset("bookshelf_sample.png"),
  placeholderRed: asset("bookshelf_placeholder_red.png"),
  placeholderGreen: asset("bookshelf_placeholder_green.png"),
  createDiarySet: asset("bookshelf_create_diary_set.png"),
  spinesFortune: asset("bookshelf_spines_fortune.png"),
  spinesDiary: asset("bookshelf_spines_diary.png"),
  owl: asset("bookshelf_owl.png"),
  plant: asset("bookshelf_plant.png"),
  lanternShelf: asset("bookshelf_lantern_shelf.png"),
  lanternFloor: asset("bookshelf_lantern_floor.png"),
} as const;

/** @deprecated FOREST_BOOKSHELF_ASSETS.background を使う */
export const FOREST_BOOKSHELF_ROOM_BG_SRC = FOREST_BOOKSHELF_ASSETS.background;

/** 背景画像の下に敷くフォールバック色 */
export const FOREST_BOOKSHELF_PAGE_BG = "#2c1f14" as const;
