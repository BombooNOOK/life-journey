/** カード幅（1024 設計）に連動するオーバーレイ文字サイズ（モバイルは +4pt 相当） */
export const pathGuideCardTextClass = {
  label: "text-[4.1cqw] font-semibold tracking-wide leading-tight lg:text-[2.6cqw]",
  title: "mt-[0.3em] text-pretty text-[5cqw] font-semibold leading-[1.3] lg:text-[3.5cqw]",
  /** 第1章・第3章など1行で収めたいタイトル用（やや小さめ） */
  titleSingleLine:
    "mt-[0.3em] whitespace-nowrap text-[4.55cqw] font-semibold leading-[1.3] lg:text-[3.35cqw]",
  body: "mt-[0.3em] whitespace-pre-line text-pretty text-[4.35cqw] leading-[1.35] lg:text-[2.85cqw]",
  meta: "mt-[0.3em] text-pretty text-[4.1cqw] leading-[1.35] lg:text-[2.6cqw]",
  action: "mt-[0.3em] text-[4.1cqw] font-medium leading-tight lg:text-[2.6cqw]",
} as const;

/** 看板タイトル（幅に連動） */
export const pathGuideTitleSignTextClass = {
  heading: "text-balance text-[5.3cqw] font-bold leading-tight tracking-wide lg:text-[3.8cqw]",
  intro: "mt-[0.35em] whitespace-pre-line text-[4.2cqw] leading-snug lg:text-[2.7cqw]",
} as const;

/** カード・看板のテキストを幅基準でスケールする */
export const pathGuideCardContainerClass = "@container relative block w-full";

/** 挿絵と重ならない左側テキスト領域 */
export const pathGuideCardTextOverlayClass =
  "absolute inset-0 flex items-center px-[5.5%] pr-[36%] py-[6%]";
