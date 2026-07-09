/**
 * カード幅（1024 設計）に連動するオーバーレイ文字サイズ。
 * 基準: プロローグ「Life Journey Diaryって？」が1行にギリ収まる大きさ。
 */
const pathGuideCardPrimarySize = "text-[5.85cqw] lg:text-[4.05cqw]";

/** カード3行（章名・タイトル・アクション）共通 */
export const pathGuideCardTextClass = {
  label: `${pathGuideCardPrimarySize} font-semibold tracking-wide leading-tight`,
  /** プロローグ見出しなど1行タイトル */
  titleOneLine: `mt-[0.2em] ${pathGuideCardPrimarySize} whitespace-nowrap font-semibold leading-[1.2]`,
  /** 章タイトル（改行あり） */
  title: `mt-[0.2em] ${pathGuideCardPrimarySize} whitespace-pre-line font-semibold leading-[1.2]`,
  action: `mt-[0.25em] ${pathGuideCardPrimarySize} font-medium leading-tight`,
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
