/** 第8幕：ログハウス建築直後の案内 */
export const FIRST_VISIT_LOGHOUSE_COMPLETE_TITLE = "ログハウスが完成しました" as const;

export const FIRST_VISIT_LOGHOUSE_COMPLETE_BODY =
  "これで、あなたの森の拠点ができました。\n\nここには、これから届く鑑定書や、\n日々書き残した日記が少しずつしまわれていきます。\n\nログハウスの使い方は、\nあとでわたしがご案内しますね。" as const;

export const FIRST_VISIT_LOGHOUSE_COMPLETE_BUTTON = "次へ" as const;

export const FIRST_VISIT_LOGHOUSE_COMPLETE_FOOTNOTE = "次は、鑑定のへやです。" as const;

export const FIRST_VISIT_LOGHOUSE_COMPLETE_ILLUSTRATION_SRC =
  "/images/ljd/first-visit/loghouse-complete.jpg" as const;

/** 完成イラストを先読み（テキストだけ先に出るのを防ぐ） */
export function preloadFirstVisitLoghouseCompleteIllustration(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = FIRST_VISIT_LOGHOUSE_COMPLETE_ILLUSTRATION_SRC;
  });
}
