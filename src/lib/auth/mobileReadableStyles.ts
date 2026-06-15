/** 老眼世代向け：認証・マイページ系のスマホ視認性（本文16px以上） */
export const mobileReadable = {
  pageTitle: "text-[1.625rem] font-bold leading-snug text-stone-900 sm:text-[1.75rem]",
  sectionTitle: "text-lg font-semibold text-stone-900 sm:text-xl",
  body: "text-base leading-[1.6] text-stone-700",
  bodyMuted: "text-base leading-[1.6] text-stone-600",
  label: "text-base font-medium text-stone-700",
  helper: "text-sm leading-[1.6] text-stone-600",
  helperMuted: "text-sm leading-[1.6] text-stone-500",
  input:
    "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-base text-stone-900 outline-none ring-stone-400 focus:ring-2",
  buttonPrimary:
    "inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-stone-800 px-4 py-2.5 text-base font-medium text-white hover:bg-stone-900 disabled:opacity-50",
  buttonSecondary:
    "inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-base font-medium text-stone-800 hover:bg-stone-50 disabled:opacity-50",
  link: "text-base text-stone-800 underline-offset-2 hover:underline",
  notice:
    "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-base leading-[1.6] text-emerald-900 whitespace-pre-line",
  error:
    "rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-base leading-[1.6] text-red-900 whitespace-pre-wrap",
} as const;
