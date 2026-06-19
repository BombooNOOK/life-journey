"use client";

import Image from "next/image";

const ACORN_SRC = "/decorations/acorn-sm.png";

/** 保存演出1段目：どんぐりの仮アニメ（後から差し替え可能） */
export function SaveTransitionAcornIndicator() {
  return (
    <div className="mx-auto flex h-16 w-16 items-center justify-center">
      <Image
        src={ACORN_SRC}
        alt=""
        aria-hidden
        width={44}
        height={48}
        unoptimized
        className="animate-[spin_2.4s_linear_infinite] motion-reduce:animate-none object-contain"
      />
    </div>
  );
}
