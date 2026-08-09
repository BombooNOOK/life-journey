export const COMPANION_SAVE_FOREST_FRAMES = [
  {
    key: "book-start",
    src: "/images/ljd/companion-save/companion_save_forest_01_book_start.png?v=2",
    label: "あしあとブックが浮かぶ",
  },
  {
    key: "book-flying",
    src: "/images/ljd/companion-save/companion_save_forest_02_book_flying.png?v=2",
    label: "あしあとブックが鑑定のへやへ向かう",
  },
  {
    key: "book-arrived",
    src: "/images/ljd/companion-save/companion_save_forest_03_book_arrived.png?v=2",
    label: "あしあとブックが鑑定のへやに届く",
  },
] as const;

/** 左→中→右と1枚ずつ出す間隔 */
export const COMPANION_SAVE_FOREST_FRAME_STEP_MS = 1000;

function preloadImage(src: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

export function preloadCompanionSaveForestAssets(): Promise<void> {
  return Promise.all(COMPANION_SAVE_FOREST_FRAMES.map((frame) => preloadImage(frame.src))).then(
    () => undefined,
  );
}
