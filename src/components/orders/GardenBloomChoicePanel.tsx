"use client";

import { useState } from "react";

import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";
import {
  GARDEN_BLOOM_CHOICE_DISPLAY,
  GARDEN_BLOOM_CHOICE_KEEP,
  GARDEN_BLOOM_CHOICE_SHARE,
  GARDEN_COMPLETE_PROMPT,
  GARDEN_COMPLETE_SUB,
  GARDEN_COMPLETE_TITLE,
  GARDEN_DISPLAY_SLOT_PICK_PROMPT,
  GARDEN_DISPLAY_SLOTS_FULL_MESSAGE,
} from "@/lib/garden/gardenCopy";
import type { GardenBloomChoice } from "@/lib/garden/gardenPlant";

type Props = {
  busy: boolean;
  freeDisplaySlots: number[];
  onChoose: (choice: GardenBloomChoice, slotIndex?: number) => void;
  /** コンパクト（モバイル下パネル向け） */
  compact?: boolean;
};

/** 満開後：飾る／このまま／おすそわけ */
export function GardenBloomChoicePanel({
  busy,
  freeDisplaySlots,
  onChoose,
  compact = false,
}: Props) {
  const [pickingSlot, setPickingSlot] = useState(false);

  const titleClass = compact
    ? "text-sm font-medium text-stone-800"
    : "text-base font-semibold text-stone-800";
  const bodyClass = compact
    ? "whitespace-pre-line text-xs leading-relaxed text-stone-600"
    : "whitespace-pre-line text-sm leading-relaxed text-stone-600";
  const btnClass = compact
    ? "inline-flex min-h-[40px] w-full items-center justify-center rounded-xl border border-emerald-300/70 bg-emerald-50/90 px-3 text-xs font-semibold text-emerald-950 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-55"
    : "inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-emerald-300/80 bg-emerald-50/90 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-55";
  const secondaryBtnClass = compact
    ? "inline-flex min-h-[40px] w-full items-center justify-center rounded-xl border border-stone-300/80 bg-[#fffdf9] px-3 text-xs font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-55"
    : "inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-stone-300/80 bg-[#fffdf9] px-4 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-55";

  if (pickingSlot) {
    if (freeDisplaySlots.length === 0) {
      return (
        <div className="space-y-2">
          <p className={bodyClass} role="status">
            {GARDEN_DISPLAY_SLOTS_FULL_MESSAGE}
          </p>
          <button
            type="button"
            disabled={busy}
            className={secondaryBtnClass}
            onClick={() => setPickingSlot(false)}
          >
            もどる
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <p className={titleClass}>{GARDEN_DISPLAY_SLOT_PICK_PROMPT}</p>
        <div className="grid grid-cols-3 gap-2">
          {freeDisplaySlots.map((slot) => (
            <button
              key={slot}
              type="button"
              disabled={busy}
              className={btnClass}
              onClick={() => onChoose("display", slot)}
            >
              {busy ? <OwlLoadingInline label="…" size="sm" /> : `場所 ${slot}`}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={busy}
          className={secondaryBtnClass}
          onClick={() => setPickingSlot(false)}
        >
          もどる
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <p className={titleClass}>{GARDEN_COMPLETE_TITLE}</p>
      <p className={bodyClass}>{GARDEN_COMPLETE_SUB}</p>
      <p className={compact ? "text-xs text-stone-700" : "text-sm text-stone-700"}>
        {GARDEN_COMPLETE_PROMPT}
      </p>
      <div className="space-y-2 pt-1">
        <button
          type="button"
          disabled={busy}
          className={btnClass}
          onClick={() => {
            if (freeDisplaySlots.length === 0) {
              onChoose("display");
              return;
            }
            setPickingSlot(true);
          }}
        >
          {GARDEN_BLOOM_CHOICE_DISPLAY}
        </button>
        <button
          type="button"
          disabled={busy}
          className={secondaryBtnClass}
          onClick={() => onChoose("keep")}
        >
          {GARDEN_BLOOM_CHOICE_KEEP}
        </button>
        <button
          type="button"
          disabled={busy}
          className={secondaryBtnClass}
          onClick={() => onChoose("share")}
        >
          {GARDEN_BLOOM_CHOICE_SHARE}
        </button>
      </div>
    </div>
  );
}
