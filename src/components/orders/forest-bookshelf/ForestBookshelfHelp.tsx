"use client";

import { useCallback, useEffect, useId, useState } from "react";

import {
  FOREST_BOOKSHELF_FIRST_VISIT_TIP,
  FOREST_BOOKSHELF_FIRST_VISIT_TIP_DISMISS,
  FOREST_BOOKSHELF_FIRST_VISIT_TIP_STORAGE_KEY,
  FOREST_BOOKSHELF_HELP_BUTTON_LABEL,
  FOREST_BOOKSHELF_HELP_MODAL_DISMISS,
  FOREST_BOOKSHELF_HELP_MODAL_LINES,
  FOREST_BOOKSHELF_HELP_MODAL_TITLE,
} from "@/lib/ljd/forestBookshelfHelpCopy";

type Props = {
  /** framed（定規）では初回案内を出さず保存もしない */
  enableFirstVisitTip?: boolean;
};

function HelpHintIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.2 9.2a2.9 2.9 0 0 1 5.6 1c0 2-2.9 2.5-2.9 4.3"
      />
      <circle cx="12" cy="17" r="0.95" fill="currentColor" stroke="none" />
    </svg>
  );
}

const helpButtonClass = [
  "inline-flex h-11 w-11 items-center justify-center rounded-full",
  "border border-[#d9cbb8]/90 bg-[#fffdf8]/90 text-[#5c4a3a]",
  "shadow-sm backdrop-blur-[3px] transition",
  "hover:bg-[#fffdf8] active:scale-[0.98]",
].join(" ");

function markFirstVisitTipSeen() {
  try {
    window.localStorage.setItem(FOREST_BOOKSHELF_FIRST_VISIT_TIP_STORAGE_KEY, "1");
  } catch {
    // ignore quota / private mode
  }
}

function hasSeenFirstVisitTip(): boolean {
  try {
    return window.localStorage.getItem(FOREST_BOOKSHELF_FIRST_VISIT_TIP_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** 森の本棚：右上？＋ヘルプモーダル＋初回吹き出し */
export function ForestBookshelfHelp({ enableFirstVisitTip = true }: Props) {
  const titleId = useId();
  const [helpOpen, setHelpOpen] = useState(false);
  const [showFirstVisitTip, setShowFirstVisitTip] = useState(false);

  useEffect(() => {
    if (!enableFirstVisitTip) return;
    if (!hasSeenFirstVisitTip()) setShowFirstVisitTip(true);
  }, [enableFirstVisitTip]);

  const dismissFirstVisitTip = useCallback(() => {
    setShowFirstVisitTip(false);
    if (!enableFirstVisitTip) return;
    markFirstVisitTipSeen();
  }, [enableFirstVisitTip]);

  const openHelp = useCallback(() => {
    setHelpOpen(true);
    if (showFirstVisitTip) dismissFirstVisitTip();
  }, [dismissFirstVisitTip, showFirstVisitTip]);

  const closeHelp = useCallback(() => {
    setHelpOpen(false);
  }, []);

  useEffect(() => {
    if (!helpOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeHelp();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeHelp, helpOpen]);

  return (
    <div className="relative">
      <button
        type="button"
        className={helpButtonClass}
        aria-label={FOREST_BOOKSHELF_HELP_BUTTON_LABEL}
        title={FOREST_BOOKSHELF_HELP_BUTTON_LABEL}
        aria-haspopup="dialog"
        aria-expanded={helpOpen}
        onClick={openHelp}
      >
        <HelpHintIcon />
      </button>

      {showFirstVisitTip && !helpOpen ? (
        <div className="pointer-events-none absolute right-0 top-[3.15rem] z-[45] w-[min(17.5rem,calc(100vw-1.5rem))]">
          <div className="pointer-events-auto rounded-xl border border-[#d9cbb8]/90 bg-[#fffdf8]/96 px-3.5 py-3 text-left shadow-lg backdrop-blur-[1px]">
            <p className="whitespace-pre-line text-xs leading-relaxed text-[#4f4033]">
              {FOREST_BOOKSHELF_FIRST_VISIT_TIP}
            </p>
            <button
              type="button"
              onClick={dismissFirstVisitTip}
              className="mt-2 inline-flex min-h-9 items-center justify-center rounded-lg px-2 text-xs font-medium text-[#5c4a3a] underline-offset-2 hover:underline"
            >
              {FOREST_BOOKSHELF_FIRST_VISIT_TIP_DISMISS}
            </button>
          </div>
        </div>
      ) : null}

      {helpOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 py-8">
          <button
            type="button"
            className="absolute inset-0 bg-stone-950/45"
            aria-label="ヘルプを閉じる"
            onClick={closeHelp}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-[1] w-full max-w-sm rounded-2xl border border-[#e4d8c6] bg-[#fffdf8] px-5 py-5 shadow-[0_12px_40px_rgba(40,28,16,0.28)]"
          >
            <h2 id={titleId} className="text-base font-semibold tracking-wide text-[#3f3428]">
              {FOREST_BOOKSHELF_HELP_MODAL_TITLE}
            </h2>
            <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-[#4f4033]">
              {FOREST_BOOKSHELF_HELP_MODAL_LINES.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={closeHelp}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[#d9cbb8] bg-[#f7f0e4] px-4 text-sm font-medium text-[#5c4a3a] shadow-sm transition hover:bg-[#f3ebe0] active:scale-[0.99]"
            >
              {FOREST_BOOKSHELF_HELP_MODAL_DISMISS}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
