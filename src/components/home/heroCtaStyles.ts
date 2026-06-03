/** トップヒーロー内CTA（スマホはややコンパクト・中央寄せでフクロウと重なりにくく） */
export const heroCtaStackClass =
  "mx-auto w-full max-w-[15.75rem] space-y-2.5 rounded-2xl p-3 sm:max-w-full sm:space-y-3 sm:p-4 md:max-w-xs";

const heroCtaButtonBase =
  "flex min-h-[44px] w-full items-center justify-center rounded-xl px-3.5 py-2.5 text-center text-[13px] font-semibold leading-snug backdrop-blur-[1px] transition sm:px-4 sm:py-3.5 sm:text-sm md:text-base";

export const heroCtaPrimaryClass = [
  heroCtaButtonBase,
  "border border-[#5b6b4d]/45 bg-[#6f8460]/76 text-white shadow-[0_1px_2px_rgba(58,73,47,0.2)] hover:bg-[#667b58]/84",
].join(" ");

export const heroCtaSecondaryClass = [
  heroCtaButtonBase,
  "border border-stone-300/75 bg-white/62 text-stone-700 hover:bg-white/78",
].join(" ");
