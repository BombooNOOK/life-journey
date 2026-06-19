"use client";

import { DecorationImage } from "@/components/ui/DecorationImage";

/** 保存演出1段目：どんぐりの仮アニメ（後から差し替え可能） */
export function SaveTransitionAcornIndicator() {
  return (
    <div className="relative mx-auto flex h-14 w-14 items-center justify-center">
      <span
        aria-hidden
        className="absolute inset-0 rounded-full bg-amber-100/70 animate-pulse"
      />
      <DecorationImage
        name="acorn-sm"
        size="lg"
        className="relative animate-[spin_2.4s_linear_infinite] motion-reduce:animate-none"
      />
    </div>
  );
}
