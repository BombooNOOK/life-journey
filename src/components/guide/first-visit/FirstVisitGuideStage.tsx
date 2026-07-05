import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** カード外の薄いスクリム（黒半透明ではない） */
  ariaLabel?: string;
};

/**
 * はじめての方へ：行き先は下に見えたまま、手前にカードだけ浮かせる。
 * 第4幕以降の案内カード用。
 */
export function FirstVisitGuideStage({ children, ariaLabel }: Props) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto px-4 py-10 sm:py-12"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[#faf8f5]/25 backdrop-blur-[1px]"
        aria-hidden
      />
      <div className="relative z-10 my-auto w-full max-w-sm py-2">{children}</div>
    </div>
  );
}
