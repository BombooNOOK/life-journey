/** はじめての道しるべ — イラスト素材 */
export const FIRST_VISIT_PATH_GUIDE_ASSET_DIR = "/images/ljd/first-visit/path-guide" as const;

/** 素材差し替え時にインクリメント（ブラウザキャッシュ回避） */
const PATH_GUIDE_ASSET_VERSION = 3;

function pathGuideAsset(path: string): string {
  return `${FIRST_VISIT_PATH_GUIDE_ASSET_DIR}/${path}?v=${PATH_GUIDE_ASSET_VERSION}`;
}

export const FIRST_VISIT_PATH_GUIDE_ASSETS = {
  bg: `${FIRST_VISIT_PATH_GUIDE_ASSET_DIR}/path_guide_bg.png`,
  titleSign: pathGuideAsset("path_guide_title_sign.png"),
  owl: `${FIRST_VISIT_PATH_GUIDE_ASSET_DIR}/path_guide_owl.png`,
  cardPrologue: pathGuideAsset("path_guide_card_prologue.png"),
  cardChapter1: pathGuideAsset("path_guide_card_chapter1.png"),
  cardChapter2: pathGuideAsset("path_guide_card_chapter2.png"),
  cardChapter3: pathGuideAsset("path_guide_card_chapter3.png"),
} as const;

/** Canva 書き出しの実ピクセル（座標合わせの基準） */
export const FIRST_VISIT_PATH_GUIDE_BG_SIZE = { widthPx: 576, heightPx: 1024 } as const;

export const FIRST_VISIT_PATH_GUIDE_TITLE_SIGN_SIZE = { widthPx: 1024, heightPx: 390 } as const;
export const FIRST_VISIT_PATH_GUIDE_PROLOGUE_CARD_SIZE = { widthPx: 1024, heightPx: 312 } as const;
export const FIRST_VISIT_PATH_GUIDE_CHAPTER_CARD_SIZE = { widthPx: 1024, heightPx: 369 } as const;

/** 章カードの最大表示幅（素材の設計幅。実機では画面幅−余白でさらに縮む） */
export const FIRST_VISIT_PATH_GUIDE_CONTENT_MAX_WIDTH_PX = 1024;

export function pathGuideAspectRatio(size: { widthPx: number; heightPx: number }): string {
  return `${size.widthPx} / ${size.heightPx}`;
}

export const FIRST_VISIT_PATH_GUIDE_IMAGE_SIZES =
  "(max-width: 1024px) calc(100vw - 2rem), 1024px" as const;
