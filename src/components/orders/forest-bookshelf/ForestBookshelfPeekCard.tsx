"use client";

import { LJD_PAPER_PRIMARY_BTN_CLASS, LJD_PAPER_SECONDARY_BTN_CLASS } from "@/lib/ljd/ljdPaperSurface";

export type ForestBookshelfPeekCardModel = {
  id: string;
  title: string;
  lines: string[];
  actionLabel: string;
  onAction: () => void;
};

type Props = {
  card: ForestBookshelfPeekCardModel;
  onClose: () => void;
  busy?: boolean;
};

/** 本タップ後の小さな情報カード（選ぶ／作る） */
export function ForestBookshelfPeekCard({ card, onClose, busy = false }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[30] flex items-end justify-center px-3 pb-[max(5.5rem,env(safe-area-inset-bottom))] sm:items-center sm:pb-8">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`forest-bookshelf-peek-${card.id}`}
        className="pointer-events-auto w-full max-w-sm rounded-[1.25rem] border border-[#e4d5c0]/95 bg-[#fdf8f0] px-4 py-4 shadow-[0_12px_36px_rgba(60,40,20,0.22)]"
      >
        <div className="mb-2 flex items-start justify-between gap-3">
          <h2
            id={`forest-bookshelf-peek-${card.id}`}
            className="text-base font-semibold leading-snug text-[#3f3428]"
          >
            {card.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-full border border-[#e0d2bc]/95 bg-[#faf3e8] text-[#6a5846] hover:bg-[#f3ead8]"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>
        <ul className="space-y-1.5 text-sm leading-relaxed text-[#5c4a35]">
          {card.lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className={`min-h-[44px] flex-1 px-3 text-sm font-medium ${LJD_PAPER_SECONDARY_BTN_CLASS}`}
          >
            閉じる
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={card.onAction}
            className={`min-h-[44px] flex-[1.4] px-3 text-sm font-semibold disabled:opacity-60 ${LJD_PAPER_PRIMARY_BTN_CLASS}`}
          >
            {card.actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
