/** トップヒーロー内CTA（主導線＝広め、サブ導線＝コンパクト・中央寄せ） */
export const heroCtaStackClass =
  "w-full space-y-3 rounded-2xl p-3 sm:space-y-3 sm:p-4 md:max-w-xs";

export const heroCtaPrimaryClass = [
  "flex min-h-[48px] w-full items-center justify-center rounded-xl border border-emerald-900/60 bg-emerald-800 px-4 py-3.5 text-center text-sm font-semibold leading-snug text-white shadow-[0_3px_10px_rgba(6,78,59,0.28)] transition hover:border-emerald-950/75 hover:bg-emerald-900 hover:shadow-[0_4px_14px_rgba(6,78,59,0.34)] active:scale-[0.98] active:opacity-95 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-400 disabled:text-white/85 disabled:shadow-none sm:min-h-[52px] sm:text-base",
].join(" ");

export const heroCtaSecondaryClass = [
  "mx-auto flex min-h-[44px] w-full max-w-[8.5rem] items-center justify-center rounded-lg border border-stone-300/75 bg-white/62 px-3 py-2.5 text-center text-xs font-semibold leading-snug text-stone-700 backdrop-blur-[1px] transition hover:bg-white/78 sm:mx-0 sm:max-w-none sm:min-h-[48px] sm:w-full sm:rounded-xl sm:px-4 sm:py-3.5 sm:text-sm md:text-base",
].join(" ");
