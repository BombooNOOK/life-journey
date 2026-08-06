"use client";

import { useState, type ReactNode } from "react";

type Props = {
  disabled?: boolean;
  children: ReactNode;
};

/** 記録日・伴走キャラ・本への掲載など、書いたあとに整える設定 */
export function JournalDiarySettingsPanel({ disabled = false, children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50/50">
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-stone-800 transition hover:bg-stone-100/80 disabled:opacity-60"
      >
        <span>あしあとの設定</span>
        <span className="text-xs font-normal text-stone-500" aria-hidden>
          {open ? "閉じる" : "開く"}
        </span>
      </button>
      {open ? (
        <div className="space-y-3 border-t border-stone-200 px-3 py-3">{children}</div>
      ) : null}
    </div>
  );
}
