"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { KANTEI_FIRST_READ_TOC_LOCKED_HINT, KANTEI_FIRST_READ_TOC_PREVIEW_NOTE } from "@/lib/pdf/kanteiFirstReadGuideCopy";
import { isPdfIndexInFirstReadRange } from "@/lib/pdf/kanteiFirstReadGuide";
import { PDF_TOC_ENTRIES } from "@/lib/pdf/pdfTocEntries";
import { buildTocJumpIndexByDestination } from "@/lib/pdf/kanteiReaderPage";

/** 没入ビューワー (z-220) より前面 */
const TOC_OVERLAY_Z_CLASS = "z-[230]" as const;

type Props = {
  open: boolean;
  currentPdfIndex: number;
  onClose: () => void;
  onJump: (pdfIndex: number, destinationId: string) => void;
  /** 初回ガイド中はライフパス章だけジャンプ可 */
  restrictedFirstRead?: boolean;
};

export function KanteiPdfTocPanel({
  open,
  currentPdfIndex,
  onClose,
  onJump,
  restrictedFirstRead = false,
}: Props) {
  const jumpMap = useMemo(() => buildTocJumpIndexByDestination(PDF_TOC_ENTRIES), []);
  const panelRef = useRef<HTMLDivElement>(null);
  const [lockedHint, setLockedHint] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = panelRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [onClose, open]);

  useEffect(() => {
    if (open) setLockedHint(null);
  }, [open]);

  if (!open) return null;

  const isJumpAllowed = (pdfIndex: number) =>
    !restrictedFirstRead || isPdfIndexInFirstReadRange(pdfIndex);

  const handleEntryClick = (pdfIndex: number, destinationId: string) => {
    if (!isJumpAllowed(pdfIndex)) {
      setLockedHint(KANTEI_FIRST_READ_TOC_LOCKED_HINT);
      return;
    }
    onJump(pdfIndex, destinationId);
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 ${TOC_OVERLAY_Z_CLASS} flex items-end justify-center bg-stone-900/45 p-0 sm:items-center sm:p-4`}
      role="dialog"
      aria-modal="true"
      aria-label="目次"
    >
      <div
        ref={panelRef}
        className="flex max-h-[min(85vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-stone-200 bg-[#faf8f5] shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
          <h2 className="text-base font-semibold text-stone-900">目次</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-stone-600 hover:bg-stone-100 hover:text-stone-900"
          >
            閉じる
          </button>
        </div>

        {restrictedFirstRead ? (
          <p className="border-b border-amber-100 bg-amber-50/70 px-4 py-2.5 text-xs leading-relaxed text-amber-950">
            {KANTEI_FIRST_READ_TOC_PREVIEW_NOTE}
          </p>
        ) : null}

        <ul className="min-h-0 flex-1 list-none overflow-y-auto p-3">
          {PDF_TOC_ENTRIES.map((entry) => {
            const pdfIndex = jumpMap.get(entry.destinationId) ?? 0;
            const isActive = pdfIndex === currentPdfIndex;
            const locked = restrictedFirstRead && !isJumpAllowed(pdfIndex);
            const buttonClass = [
              "w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-amber-50",
              entry.kind === "section" ? "font-semibold text-stone-900" : "text-stone-800",
              entry.kind === "item"
                ? "flex items-baseline justify-between gap-3 py-1.5"
                : "",
              isActive ? "bg-amber-100/80 ring-1 ring-amber-200" : "",
              locked ? "cursor-default opacity-45 hover:bg-transparent" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <li key={entry.destinationId} className={entry.kind === "section" ? "mt-3 first:mt-0" : ""}>
                <button
                  type="button"
                  onClick={() => handleEntryClick(pdfIndex, entry.destinationId)}
                  className={buttonClass}
                  aria-disabled={locked || undefined}
                >
                  <span className="min-w-0 flex-1">{entry.label}</span>
                  {entry.kind === "item" ? (
                    <span className="shrink-0 tabular-nums text-xs text-stone-500">{entry.page}</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>

        {lockedHint ? (
          <p className="border-t border-amber-100 bg-amber-50/80 px-4 py-3 text-xs leading-relaxed text-amber-950">
            {lockedHint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
