"use client";

import { useLayoutEffect, useState } from "react";

import {
  COMPANION_SAVE_FOREST_FRAMES,
  COMPANION_SAVE_FOREST_FRAME_STEP_MS,
} from "@/lib/journal/companionWriting/companionSaveForestAssets";

/** 伴走保存後：日記ブック3枚が左・中・右へ順番に現れる */
export function CompanionSaveForestDeliveryIndicator() {
  const [visibleCount, setVisibleCount] = useState(0);

  useLayoutEffect(() => {
    let cancelled = false;
    const timers: number[] = [];

    const revealAll = () => {
      if (!cancelled) setVisibleCount(COMPANION_SAVE_FOREST_FRAMES.length);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      revealAll();
      return () => {
        cancelled = true;
      };
    }

    COMPANION_SAVE_FOREST_FRAMES.forEach((_, index) => {
      timers.push(
        window.setTimeout(() => {
          if (!cancelled) setVisibleCount(index + 1);
        }, index * COMPANION_SAVE_FOREST_FRAME_STEP_MS),
      );
    });

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  return (
    <div
      className="mx-auto flex w-[min(100%,22rem)] items-end justify-center gap-2 sm:w-[min(100%,26rem)] sm:gap-3"
      aria-hidden
    >
      {COMPANION_SAVE_FOREST_FRAMES.map((frame, index) => {
        const visible = index < visibleCount;
        return (
          <div
            key={frame.key}
            className={`flex h-[7.5rem] w-[6.5rem] shrink-0 items-end justify-center sm:h-[8.5rem] sm:w-[7.5rem] ${
              visible ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- 先読み済み img でぱっと表示 */}
            <img
              src={frame.src}
              alt=""
              width={120}
              height={120}
              decoding="sync"
              className="max-h-full max-w-full object-contain object-bottom"
            />
          </div>
        );
      })}
    </div>
  );
}
