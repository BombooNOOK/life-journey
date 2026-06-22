"use client";

import { useEffect, useMemo, useRef } from "react";

import { PDF_TOC_ENTRIES } from "@/lib/pdf/pdfTocEntries";
import { buildTocJumpIndexByDestination } from "@/lib/pdf/kanteiReaderPage";

/** 没入ビューワー (z-220) より前面 */
const TOC_OVERLAY_Z_CLASS = "z-[230]" as const;

type Props = {
  open: boolean;
  currentPdfIndex: number;
  onClose: () => void;
  onJump: (pdfIndex: number, destinationId: string) => void;
};

export function KanteiPdfTocPanel({ open, currentPdfIndex, onClose, onJump }: Props) {
  const jumpMap = useMemo(() => buildTocJumpIndexByDestination(PDF_TOC_ENTRIES), []);
  const panelRef = useRef<HTMLDivElement>(null);

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

  if (!open) return null;

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
        <ul className="min-h-0 flex-1 list-none overflow-y-auto p-3">
          {PDF_TOC_ENTRIES.map((entry) => {
            const pdfIndex = jumpMap.get(entry.destinationId) ?? 0;
            const isActive = pdfIndex === currentPdfIndex;
            if (entry.kind === "section") {
              return (
                <li key={entry.destinationId} className="mt-3 first:mt-0">
                  <button
                    type="button"
                    onClick={() => {
                      onJump(pdfIndex, entry.destinationId);
                      onClose();
                    }}
                    className={[
                      "w-full rounded-lg px-2 py-2 text-left text-sm font-semibold text-stone-900 hover:bg-amber-50",
                      isActive ? "bg-amber-100/80 ring-1 ring-amber-200" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {entry.label}
                  </button>
                </li>
              );
            }
            return (
              <li key={entry.destinationId}>
                <button
                  type="button"
                  onClick={() => {
                    onJump(pdfIndex, entry.destinationId);
                    onClose();
                  }}
                  className={[
                    "flex w-full items-baseline justify-between gap-3 rounded-lg px-2 py-1.5 text-left text-sm text-stone-800 hover:bg-amber-50/80",
                    isActive ? "bg-amber-50 font-medium ring-1 ring-amber-200" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span className="min-w-0 flex-1">{entry.label}</span>
                  <span className="shrink-0 tabular-nums text-xs text-stone-500">{entry.page}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
