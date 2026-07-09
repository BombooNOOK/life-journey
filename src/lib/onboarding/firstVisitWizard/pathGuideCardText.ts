/** カード幅（1024 設計）に連動するオーバーレイ文字サイズ（モバイルは +2pt 相当） */
export const pathGuideCardTextClass = {
  label: "text-[3.35cqw] font-semibold tracking-wide leading-tight lg:text-[2.6cqw]",
  title: "mt-[0.3em] text-pretty text-[4.25cqw] font-semibold leading-[1.3] lg:text-[3.5cqw]",
  body: "mt-[0.3em] whitespace-pre-line text-pretty text-[3.6cqw] leading-[1.35] lg:text-[2.85cqw]",
  meta: "mt-[0.3em] text-pretty text-[3.35cqw] leading-[1.35] lg:text-[2.6cqw]",
  action: "mt-[0.3em] text-[3.35cqw] font-medium leading-tight lg:text-[2.6cqw]",
} as const;

/** 看板タイトル（幅に連動） */
export const pathGuideTitleSignTextClass = {
  heading: "text-balance text-[4.55cqw] font-bold leading-tight tracking-wide lg:text-[3.8cqw]",
  intro: "mt-[0.3em] text-balance text-[3.45cqw] leading-snug lg:text-[2.7cqw]",
} as const;

/** カード・看板のテキストを幅基準でスケールする */
export const pathGuideCardContainerClass = "@container relative block w-full";

/** 挿絵と重ならない左側テキスト領域 */
export const pathGuideCardTextOverlayClass =
  "absolute inset-0 flex items-center px-[5.5%] pr-[36%] py-[6%]";
