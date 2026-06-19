/** 日記保存後演出の全画面背景（BambooNOOKの森） */
export const SAVE_TRANSITION_FOREST_BG_MOBILE_SRC =
  "/images/journal/save-complete-forest-bg-mobile.png" as const;

export const SAVE_TRANSITION_FOREST_BG_DESKTOP_SRC =
  "/images/journal/save-complete-forest-bg-desktop.png" as const;

export const SAVE_TRANSITION_ACORN_SRC = "/decorations/acorn-sm.png" as const;

function preloadImage(src: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

/** 1段目（森背景・どんぐり）をまとめて出す前に読み込む */
export function preloadSaveTransitionOpeningAssets(): Promise<void> {
  return Promise.all([
    preloadImage(SAVE_TRANSITION_FOREST_BG_MOBILE_SRC),
    preloadImage(SAVE_TRANSITION_FOREST_BG_DESKTOP_SRC),
    preloadImage(SAVE_TRANSITION_ACORN_SRC),
  ]).then(() => undefined);
}

/** 2段目（どうぶつ鑑定士）をまとめて出す前に読み込む */
export function preloadSaveTransitionAnimalAsset(imagePath: string): Promise<void> {
  return preloadImage(imagePath);
}
