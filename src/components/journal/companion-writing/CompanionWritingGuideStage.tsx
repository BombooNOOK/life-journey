"use client";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** カード外の薄いスクラim（黒半透明ではない） */
  ariaLabel?: string;
};

/**
 * 伴走導線専用：行き先は下に見えたまま、手前にカードだけ浮かせる。
 * 黒オーバーレイなし。カード外タップは透過しない（視線をカードに集める）。
 */
export function CompanionWritingGuideStage({ children, ariaLabel }: Props) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-10 sm:py-12"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[#faf8f5]/25 backdrop-blur-[1px]"
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-sm">{children}</div>
    </div>
  );
}
