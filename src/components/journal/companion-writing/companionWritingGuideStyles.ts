/** 伴走導線専用：ふわっと浮いたガイドカード（黒オーバーレイなし） */
export const companionWritingFloatingGuideClass = [
  "relative z-20 rounded-2xl border border-emerald-200/90",
  "bg-gradient-to-br from-[#fffbf5] via-[#f8faf4] to-emerald-50/85",
  "p-4 shadow-[0_14px_44px_-14px_rgba(24,83,53,0.24)]",
  "ring-1 ring-emerald-100/90",
  "sm:p-5",
].join(" ");

export const companionWritingGuideTitleClass =
  "text-base font-semibold leading-snug text-emerald-950 sm:text-lg";

export const companionWritingGuideBodyClass =
  "mt-2 text-sm leading-relaxed text-stone-700";

export const companionWritingGuidePrimaryButtonClass =
  "flex min-h-[44px] w-full items-center justify-center rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-900";

export const companionWritingGuideSecondaryButtonClass =
  "flex min-h-[44px] w-full items-center justify-center rounded-xl border border-emerald-200/90 bg-white/90 px-4 py-2.5 text-sm font-medium text-emerald-950 shadow-sm transition hover:bg-emerald-50/80";

export const companionWritingGuideTertiaryButtonClass =
  "flex min-h-[44px] w-full items-center justify-center rounded-xl border border-stone-200/90 bg-[#faf8f4] px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100/80";

export function companionWritingEmphasisChipClass(emphasized: boolean): string {
  return emphasized
    ? "rounded-full border border-emerald-300/90 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-950 ring-2 ring-emerald-200/70"
    : "rounded-full border border-stone-200/90 bg-white/80 px-3 py-1.5 text-xs font-medium text-stone-600";
}

export function companionWritingZoneHintClass(emphasized: boolean, spotlight = false): string {
  if (spotlight) {
    return [
      "mb-3 flex w-full items-center gap-2 rounded-xl border border-emerald-400/90 bg-emerald-50 px-3 py-2.5",
      "text-sm font-semibold leading-snug text-emerald-950 shadow-sm ring-2 ring-emerald-300/70 animate-pulse",
    ].join(" ");
  }
  return [
    "mb-2 inline-flex max-w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium leading-snug",
    emphasized
      ? "border border-emerald-300/80 bg-emerald-50/95 text-emerald-950 ring-1 ring-emerald-200/60"
      : "border border-stone-200/80 bg-[#faf8f4]/95 text-stone-600",
  ].join(" ");
}

export function companionWritingZoneSectionClass(active: boolean): string {
  if (!active) return "";
  return [
    "rounded-xl bg-emerald-50/35 ring-2 ring-emerald-400/75 ring-offset-2",
    "transition-[box-shadow,background-color] duration-300",
  ].join(" ");
}

/** 伴走ウィザード各ステップ：スマホはカード枠なし、sm以上は白カード */
export const companionWritingWizardStepClass =
  "space-y-4 sm:rounded-xl sm:border sm:border-stone-200 sm:bg-white sm:p-5 sm:shadow-sm";

export const companionWritingWizardStepHeadingClass =
  "text-base font-medium text-stone-900 sm:text-sm";

export const companionWritingWizardStepBodyClass =
  "text-base leading-relaxed text-stone-600 sm:text-sm";
