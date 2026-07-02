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
      className="mx-auto flex h-20 w-[min(100%,20rem)] items-end justify-center gap-4 sm:h-24 sm:w-[min(100%,24rem)] sm:gap-5"
      aria-hidden
    >
      {COMPANION_SAVE_FOREST_FRAMES.map((frame, index) => {
        const visible = index < visibleCount;
        return (
          <div
            key={frame.key}
            className={`flex h-[11.5rem] w-[9.5rem] shrink-0 items-end justify-center sm:h-[13.5rem] sm:w-[11rem] ${
              visible ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- 先読み済み img でぱっと表示 */}
            <img
              src={frame.src}
              alt=""
              width={220}
              height={220}
              decoding="sync"
              className="max-h-[11.5rem] max-w-[9.5rem] object-contain object-bottom sm:max-h-[13.5rem] sm:max-w-[11rem]"
            />
          </div>
        );
      })}
    </div>
  );
}
