/** 伴走導線専用：ふわっと浮いたガイドカード（黒オーバーレイなし・半没入紙トーン） */
export const companionWritingFloatingGuideClass = [
  "relative z-20 rounded-2xl border border-[#e4d5c0]/95",
  "bg-gradient-to-br from-[#fffbf5] via-[#faf6ec] to-[#eef1e4]/90",
  "p-4 shadow-[0_10px_32px_-12px_rgba(90,70,45,0.18)]",
  "ring-1 ring-[#e8dcc8]/80",
  "sm:p-5",
].join(" ");

export const companionWritingGuideTitleClass =
  "text-base font-semibold leading-snug text-[#3f3428] sm:text-lg";

export const companionWritingGuideBodyClass =
  "mt-2 text-sm leading-relaxed text-[#5c4a35]";

export const companionWritingGuidePrimaryButtonClass =
  "flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[#b8893d]/80 bg-[#b8893d] px-4 py-2.5 text-sm font-medium text-white shadow-[0_2px_8px_rgba(90,70,45,0.12)] transition hover:border-[#a67a32] hover:bg-[#a67a32]";

export const companionWritingGuideSecondaryButtonClass =
  "flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[#e0d2bc]/95 bg-[#faf3e8] px-4 py-2.5 text-sm font-medium text-[#5c4a35] shadow-sm transition hover:border-[#d5c3a8] hover:bg-[#f3ead8]";

export const companionWritingGuideTertiaryButtonClass =
  "flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[#ebe2d4]/90 bg-[#f7efe3]/90 px-4 py-2.5 text-sm font-medium text-[#6a5846] transition hover:bg-[#f3ead8]";

export function companionWritingEmphasisChipClass(emphasized: boolean): string {
  return emphasized
    ? "rounded-full border border-[#a8b08f]/95 bg-[#eef1e4] px-3 py-1.5 text-xs font-medium text-[#4a5440] ring-2 ring-[#c5d0a8]/70"
    : "rounded-full border border-[#e0d2bc]/90 bg-[#fffaf2]/90 px-3 py-1.5 text-xs font-medium text-[#6a5846]";
}

export function companionWritingZoneHintClass(emphasized: boolean, spotlight = false): string {
  if (spotlight) {
    return [
      "mb-3 flex w-full items-center gap-2 rounded-xl border border-[#a8b08f]/95 bg-[#eef1e4] px-3 py-2.5",
      "text-sm font-semibold leading-snug text-[#4a5440] shadow-sm ring-2 ring-[#c5d0a8]/70 animate-pulse",
    ].join(" ");
  }
  return [
    "mb-2 inline-flex max-w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium leading-snug",
    emphasized
      ? "border border-[#a8b08f]/90 bg-[#eef1e4]/95 text-[#4a5440] ring-1 ring-[#c5d0a8]/60"
      : "border border-[#e0d2bc]/80 bg-[#faf3e8]/95 text-[#6a5846]",
  ].join(" ");
}

export function companionWritingZoneSectionClass(active: boolean): string {
  if (!active) return "";
  return [
    "rounded-xl bg-[#eef1e4]/55 ring-2 ring-[#a8b08f]/80 ring-offset-2 ring-offset-[#f6f0e6]",
    "transition-[box-shadow,background-color] duration-300",
  ].join(" ");
}

/** 伴走ウィザード各ステップ：スマホはカード枠なし、sm以上は紙カード */
export const companionWritingWizardStepClass =
  "space-y-4 sm:rounded-[1.25rem] sm:border sm:border-[#e4d5c0]/95 sm:bg-[#fdf8f0] sm:p-5 sm:shadow-[0_6px_18px_rgba(90,70,45,0.06)]";

export const companionWritingWizardStepHeadingClass =
  "text-base font-medium text-[#3f3428] sm:text-sm";

export const companionWritingWizardStepBodyClass =
  "text-base leading-relaxed text-[#5c4a35] sm:text-sm";
