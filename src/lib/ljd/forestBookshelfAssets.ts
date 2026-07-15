/** 森の本棚 — アセットパス（576×1024 設計）
 *
 * 本体差し替え: `public/images/ljd/bookshelf/bookshelf_main.png` を上書きし、
 * `ASSET_VERSION` を +1 する（キャッシュ破棄）。パーツ類は別ファイルのまま。
 */

export const FOREST_BOOKSHELF_ASSET_DIR = "/images/ljd/bookshelf" as const;
/** 本体画像差し替え時に上げる */
const ASSET_VERSION = 3;

function asset(filename: string): string {
  return `${FOREST_BOOKSHELF_ASSET_DIR}/${filename}?v=${ASSET_VERSION}`;
}

export const FOREST_BOOKSHELF_INTRINSIC = {
  widthPx: 576,
  heightPx: 1024,
} as const;

export const FOREST_BOOKSHELF_ASSETS = {
  main: asset("bookshelf_main.png"),
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

/** ページ背景（やや薄暗い書斎系の生成り） */
export const FOREST_BOOKSHELF_PAGE_BG = "#ebe2d4" as const;
