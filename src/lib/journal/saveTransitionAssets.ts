/** 日記保存後演出の全画面背景（BambooNOOKの森） */
export const SAVE_TRANSITION_FOREST_BG_MOBILE_SRC =
  "/images/journal/save-complete-forest-bg-mobile.png" as const;

export const SAVE_TRANSITION_FOREST_BG_DESKTOP_SRC =
  "/images/journal/save-complete-forest-bg-desktop.png" as const;

/** 1段目：左→中→右の順で出る森の小物（切り株・きのこ・どんぐり） */
export const SAVE_TRANSITION_DECO_STUMP_SRC =
  "/images/journal/save-transition-deco-stump.png" as const;

export const SAVE_TRANSITION_DECO_MUSHROOM_SRC =
  "/images/journal/save-transition-deco-mushroom.png" as const;

export const SAVE_TRANSITION_DECO_ACORN_SRC =
  "/images/journal/save-transition-deco-acorn.png" as const;

export const SAVE_TRANSITION_DECO_ITEMS = [
  { key: "stump", src: SAVE_TRANSITION_DECO_STUMP_SRC, label: "切り株" },
  { key: "mushroom", src: SAVE_TRANSITION_DECO_MUSHROOM_SRC, label: "きのこ" },
  { key: "acorn", src: SAVE_TRANSITION_DECO_ACORN_SRC, label: "どんぐり" },
] as const;

/** カード表示後、最初の小物が出るまで */
export const SAVE_TRANSITION_DECO_INITIAL_DELAY_MS = 300;

/** 小物が左→中→右と順に出る間隔 */
export const SAVE_TRANSITION_DECO_STEP_MS = 550;

function preloadImage(src: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

/** 1段目（森背景・切り株/きのこ/どんぐり）をまとめて出す前に読み込む */
export function preloadSaveTransitionOpeningAssets(): Promise<void> {
  return Promise.all([
    preloadImage(SAVE_TRANSITION_FOREST_BG_MOBILE_SRC),
    preloadImage(SAVE_TRANSITION_FOREST_BG_DESKTOP_SRC),
    ...SAVE_TRANSITION_DECO_ITEMS.map((item) => preloadImage(item.src)),
  ]).then(() => undefined);
}

/** 2段目（どうぶつ鑑定士）をまとめて出す前に読み込む */
export function preloadSaveTransitionAnimalAsset(imagePath: string): Promise<void> {
  return preloadImage(imagePath);
}
