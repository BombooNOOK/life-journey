"use client";

import { useState } from "react";

import {
  MORI_LOG_CTA_BODY,
  MORI_LOG_CTA_HEADING,
  MORI_LOG_CTA_PRIMARY,
  MORI_LOG_CTA_SECONDARY,
} from "@/lib/journal/moriLog/moriLogCopy";
import {
  LJD_PAPER_CARD_CLASS,
  LJD_PAPER_PRIMARY_BTN_CLASS,
  LJD_PAPER_SECONDARY_BTN_CLASS,
} from "@/lib/ljd/ljdPaperSurface";

type Props = {
  onOpenMoriLog: () => void;
};

export function MoriLogReadableCta({ onOpenMoriLog }: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <section
      className={`${LJD_PAPER_CARD_CLASS} border-[#c5d4b8]/90 bg-[#f4f7ef]/95 px-4 py-4 sm:px-5 sm:py-5`}
      aria-label="森ログへのご案内"
    >
      <h3 className="lj-read-desc font-semibold text-[#3f4a34]">{MORI_LOG_CTA_HEADING}</h3>
      <p className="lj-read-desc mt-3 whitespace-pre-wrap leading-relaxed text-[#4a5440]">
        {MORI_LOG_CTA_BODY}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onOpenMoriLog}
          className={`min-h-[44px] px-4 py-2.5 text-base ${LJD_PAPER_PRIMARY_BTN_CLASS}`}
        >
          {MORI_LOG_CTA_PRIMARY}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className={`min-h-[44px] px-4 py-2.5 text-base ${LJD_PAPER_SECONDARY_BTN_CLASS}`}
        >
          {MORI_LOG_CTA_SECONDARY}
        </button>
      </div>
    </section>
  );
}
