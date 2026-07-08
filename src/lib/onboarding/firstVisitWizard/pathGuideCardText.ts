/** カード幅（1024 設計）に連動するオーバーレイ文字サイズ */
export const pathGuideCardTextClass = {
  label: "text-[2.6cqw] font-semibold tracking-wide leading-tight",
  title: "mt-[0.3em] text-pretty text-[3.5cqw] font-semibold leading-[1.3]",
  body: "mt-[0.3em] whitespace-pre-line text-pretty text-[2.85cqw] leading-[1.35]",
  meta: "mt-[0.3em] text-pretty text-[2.6cqw] leading-[1.35]",
  action: "mt-[0.3em] text-[2.6cqw] font-medium leading-tight",
} as const;

/** 看板タイトル（幅に連動） */
export const pathGuideTitleSignTextClass = {
  heading: "text-balance text-[3.8cqw] font-bold leading-tight tracking-wide",
  intro: "mt-[0.3em] text-balance text-[2.7cqw] leading-snug",
} as const;

/** カード・看板のテキストを幅基準でスケールする */
export const pathGuideCardContainerClass = "@container relative block w-full";

/** 挿絵と重ならない左側テキスト領域 */
export const pathGuideCardTextOverlayClass =
  "absolute inset-0 flex items-center px-[5.5%] pr-[36%] py-[6%]";
