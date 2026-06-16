/** トップヒーロー内CTA（初回・継続の2導線を縦並び・やや左寄せ） */
export const heroCtaStackClass =
  "ml-2 mr-auto flex w-max max-w-[calc(100%-min(11.25rem,47vw))] flex-col items-stretch md:ml-[12%] md:max-w-[calc(100%-1.5rem)] lg:ml-[14%]";

/** 将来の文字サイズ設定では、CTAは本文より控えめに拡大（max クランプ想定） */

export const heroCtaSecondaryHintClass =
  "text-center text-[10px] leading-4 text-stone-500 sm:text-[11px] sm:leading-4";

/** ボタン上の注記・文字サイズ用（ボタンより幅に余裕を持たせる） */
export const heroCtaTextBandClass =
  "ml-2 mr-auto w-max max-w-[calc(100%-0.75rem)] pl-2 md:ml-[12%] md:pl-0 lg:ml-[14%]";

/** 主CTAの直上：お試し・補足（2行まとめてボタン上に配置） */
export const heroCtaMicrocopyGroupClass =
  "flex w-full flex-col items-center gap-0.5 text-center sm:gap-1";

/** 主CTAの直上：お試し案内（rem 指定で大きめ設定時のみ拡大） */
export const heroCtaMicrocopyAboveButtonClass =
  "whitespace-nowrap text-[0.5rem] font-medium leading-none tracking-wide text-stone-600 sm:text-[0.625rem]";

/** 主CTAの直上：補足（※） */
export const heroCtaMicrocopyBelowButtonClass =
  "whitespace-nowrap text-[0.53125rem] leading-none text-stone-600 sm:text-[0.59375rem]";

/** 主CTAと直上メッセージのまとまり（ボタンのみ） */
export const heroCtaButtonsGroupClass = "flex w-full flex-col items-stretch gap-2 sm:gap-2.5";

/** 継続導線（記録の続き／ログイン）：初回CTAと同幅・やや軽いトーン */
export const heroCtaContinueClass = [
  "flex min-h-[48px] w-full min-w-[11.25rem] flex-col items-center justify-center gap-0.5 rounded-xl border border-emerald-400/75 bg-[#fffdf9]/92 px-2.5 py-3 text-center shadow-[0_2px_8px_rgba(6,78,59,0.1)] backdrop-blur-[1px] transition hover:border-emerald-500 hover:bg-white hover:shadow-[0_3px_12px_rgba(6,78,59,0.14)] active:scale-[0.98] active:opacity-95 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-100 disabled:text-stone-400 disabled:shadow-none sm:min-h-[50px] sm:px-3.5 sm:py-3.5",
].join(" ");

export const heroCtaContinueLeadClass =
  "whitespace-nowrap text-sm font-semibold leading-snug text-emerald-950 sm:text-base";

export const heroCtaContinueSubClass =
  "text-[0.625rem] font-medium leading-tight text-emerald-800/80 sm:text-[0.6875rem]";

export const heroCtaPrimaryClass = [
  "flex min-h-[48px] w-full min-w-[11.25rem] items-center justify-center whitespace-nowrap rounded-xl border border-emerald-900/60 bg-emerald-800 px-2.5 py-3.5 text-center text-sm font-semibold leading-snug text-white shadow-[0_3px_10px_rgba(6,78,59,0.28)] transition hover:border-emerald-950/75 hover:bg-emerald-900 hover:shadow-[0_4px_14px_rgba(6,78,59,0.34)] active:scale-[0.98] active:opacity-95 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-400 disabled:text-white/85 disabled:shadow-none sm:min-h-[52px] sm:px-3.5 sm:text-base",
].join(" ");

export const heroCtaSecondaryClass = [
  "mx-auto flex min-h-[44px] w-full max-w-[8.5rem] items-center justify-center rounded-lg border border-stone-300/75 bg-white/62 px-3 py-2.5 text-center text-xs font-semibold leading-snug text-stone-700 backdrop-blur-[1px] transition hover:bg-white/78 sm:mx-0 sm:max-w-none sm:min-h-[48px] sm:w-full sm:rounded-xl sm:px-4 sm:py-3.5 sm:text-sm md:text-base",
].join(" ");

/** ページ下部など：中央寄せの単体CTA */
export const heroCtaClosingStackClass =
  "mx-auto flex w-full max-w-[17rem] flex-col items-stretch";

/** ページ下部の補足文 */
export const heroCtaClosingMicrocopyClass =
  "text-center text-[0.53125rem] leading-[1.45] text-stone-600 sm:text-[0.59375rem] sm:leading-[1.5]";
