"use client";

import { useEffect, useState } from "react";

import { OwlSpinIndicator } from "@/components/ui/OwlSpinIndicator";
import { JOURNAL_SAVE_TRANSITION_RANDOM_LINE_DELAY_MS } from "@/lib/journal/journalSaveTransitionCopy";

type Props = {
  randomLine: string;
};

/**
 * 新規日記保存直後：ストーリーのように一瞬だけ表示するフクロウ演出。
 * くるくる表示は仮置き（OwlSpinIndicator）。後から差し替え可能。
 */
export function JournalSaveStoryTransitionOverlay({ randomLine }: Props) {
  const [showRandomLine, setShowRandomLine] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowRandomLine(true);
    }, JOURNAL_SAVE_TRANSITION_RANDOM_LINE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-[#ebe3d6] via-[#f5efe6] to-[#ddd4c6] px-4"
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      <div className="w-full max-w-sm">
        <div className="overflow-hidden rounded-2xl border border-amber-300/50 bg-gradient-to-br from-[#fffdf9] via-[#faf4ea] to-[#f0e6d8] shadow-[0_12px_40px_rgba(92,74,54,0.16)]">
          <div className="h-1 bg-gradient-to-r from-amber-200/40 via-amber-400/70 to-amber-200/40" />

          <div className="px-6 pb-7 pt-8 text-center">
            <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-amber-100/80 animate-pulse"
              />
              <span
                aria-hidden
                className="absolute inset-1 rounded-full border border-amber-200/90"
              />
              <OwlSpinIndicator size="md" className="relative text-3xl" />
            </div>

            <p className="text-[15px] font-medium leading-7 tracking-wide text-stone-800">
              この日の数字をひらいています…
            </p>

            <div
              className={[
                "mt-6 min-h-[3.5rem] transition-all duration-500 ease-out",
                showRandomLine ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
              ].join(" ")}
              aria-hidden={!showRandomLine}
            >
              <p className="whitespace-pre-wrap border-t border-amber-200/60 pt-5 text-sm leading-7 text-stone-600">
                {randomLine}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
