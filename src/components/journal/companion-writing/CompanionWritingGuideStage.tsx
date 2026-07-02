"use client";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** カード外の薄いスクラim（黒半透明ではない） */
  ariaLabel?: string;
  /**
   * intro: スマホは全画面（カードなし）、sm以上は従来の浮きカード
   * card: 常に浮きカード（既定）
   */
  variant?: "card" | "intro";
};

/**
 * 伴走導線専用：行き先は下に見えたまま、手前にカードだけ浮かせる。
 * 黒オーバーレイなし。カード外タップは透過しない（視線をカードに集める）。
 */
export function CompanionWritingGuideStage({
  children,
  ariaLabel,
  variant = "card",
}: Props) {
  const introOnMobile = variant === "intro";

  return (
    <div
      className={[
        "fixed inset-0 z-[60] flex",
        introOnMobile
          ? "flex-col justify-center bg-[#f8faf4] px-6 py-12 sm:items-center sm:justify-center sm:bg-transparent sm:px-4 sm:py-12"
          : "items-center justify-center px-4 py-10 sm:py-12",
      ].join(" ")}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div
        className={[
          "pointer-events-none absolute inset-0 bg-[#faf8f5]/25 backdrop-blur-[1px]",
          introOnMobile ? "hidden sm:block" : "",
        ].join(" ")}
        aria-hidden
      />
      <div
        className={[
          "relative z-10 w-full",
          introOnMobile ? "max-w-md sm:max-w-sm" : "max-w-sm",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}
