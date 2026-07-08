"use client";

import { createPortal } from "react-dom";

import { FIRST_VISIT_BACK_BLOCKED_HINT } from "@/lib/onboarding/firstVisitWizard/backBlockCopy";

type Props = {
  open: boolean;
  onDismiss?: () => void;
};

function ProhibitionMark() {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden
      className="h-12 w-12 text-stone-700"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="3" />
      <path d="M14 34L34 14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** スワイプ戻りを試みたときの禁止表示＋案内 */
export function BrowserBackBlockedHint({ open, onDismiss }: Props) {
  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[max(5.5rem,env(safe-area-inset-bottom))] z-[250] flex justify-center px-4"
      role="status"
      aria-live="assertive"
    >
      <div className="pointer-events-auto flex max-w-sm items-start gap-3 rounded-2xl border border-stone-300/90 bg-[#fffdf9]/96 px-4 py-3.5 shadow-lg backdrop-blur-sm">
        <ProhibitionMark />
        <div className="min-w-0 pt-1">
          <p className="text-sm font-medium leading-relaxed text-stone-800">
            {FIRST_VISIT_BACK_BLOCKED_HINT}
          </p>
          {onDismiss ? (
            <button
              type="button"
              onClick={onDismiss}
              className="mt-2 text-xs text-stone-500 underline-offset-2 hover:text-stone-700 hover:underline"
            >
              閉じる
            </button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
