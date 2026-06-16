/** トップヒーロー内CTA（初回・継続の2導線を縦並び） */
export const heroCtaStackClass = "w-full max-w-[17.75rem] sm:max-w-none md:max-w-xs";

/** 将来の文字サイズ設定では、CTAは本文より控えめに拡大（max クランプ想定） */

export const heroCtaSecondaryHintClass =
  "text-center text-[10px] leading-4 text-stone-500 sm:text-[11px] sm:leading-4";

/** 主CTAの直上：お試し案内 */
export const heroCtaMicrocopyAboveButtonClass =
  "mx-auto w-fit max-w-[17rem] text-center text-[8px] font-medium leading-[1.4] tracking-wide text-stone-600 sm:max-w-none sm:text-[10px] sm:leading-[1.5]";

/** 主CTAの直下：補足（※） */
export const heroCtaMicrocopyBelowButtonClass =
  "mx-auto w-fit max-w-[17rem] text-center text-[8.5px] leading-[1.45] text-stone-600 sm:max-w-none sm:text-[9.5px] sm:leading-[1.5]";

/** 継続導線（記録の続き／ログイン）：初回CTAと同幅・やや軽いトーン */
export const heroCtaContinueClass = [
  "flex min-h-[48px] w-full flex-col items-center justify-center gap-0.5 rounded-xl border border-emerald-400/75 bg-[#fffdf9]/96 px-4 py-3 text-center shadow-[0_2px_8px_rgba(6,78,59,0.1)] backdrop-blur-[1px] transition hover:border-emerald-500 hover:bg-white hover:shadow-[0_3px_12px_rgba(6,78,59,0.14)] active:scale-[0.98] active:opacity-95 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-100 disabled:text-stone-400 disabled:shadow-none sm:min-h-[50px] sm:py-3.5",
].join(" ");

export const heroCtaContinueLeadClass =
  "text-sm font-semibold leading-snug text-emerald-950 sm:text-base";

export const heroCtaContinueSubClass =
  "text-[10px] font-medium leading-tight text-emerald-800/80 sm:text-[11px]";

export const heroCtaPrimaryClass = [
  "flex min-h-[48px] w-full items-center justify-center rounded-xl border border-emerald-900/60 bg-emerald-800 px-4 py-3.5 text-center text-sm font-semibold leading-snug text-white shadow-[0_3px_10px_rgba(6,78,59,0.28)] transition hover:border-emerald-950/75 hover:bg-emerald-900 hover:shadow-[0_4px_14px_rgba(6,78,59,0.34)] active:scale-[0.98] active:opacity-95 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-400 disabled:text-white/85 disabled:shadow-none sm:min-h-[52px] sm:text-base",
].join(" ");

export const heroCtaSecondaryClass = [
  "mx-auto flex min-h-[44px] w-full max-w-[8.5rem] items-center justify-center rounded-lg border border-stone-300/75 bg-white/62 px-3 py-2.5 text-center text-xs font-semibold leading-snug text-stone-700 backdrop-blur-[1px] transition hover:bg-white/78 sm:mx-0 sm:max-w-none sm:min-h-[48px] sm:w-full sm:rounded-xl sm:px-4 sm:py-3.5 sm:text-sm md:text-base",
].join(" ");
