"use client";

import { useLayoutEffect, useState } from "react";

import {
  SAVE_TRANSITION_DECO_INITIAL_DELAY_MS,
  SAVE_TRANSITION_DECO_ITEMS,
  SAVE_TRANSITION_DECO_STEP_MS,
} from "@/lib/journal/saveTransitionAssets";

/** 保存演出1段目：切り株→きのこ→どんぐりが左・中・右に順番に現れる */
export function SaveTransitionForestDecoIndicator() {
  const [visibleCount, setVisibleCount] = useState(0);

  useLayoutEffect(() => {
    let cancelled = false;
    const timers: number[] = [];

    const revealAll = () => {
      if (!cancelled) setVisibleCount(SAVE_TRANSITION_DECO_ITEMS.length);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      revealAll();
      return () => {
        cancelled = true;
      };
    }

    SAVE_TRANSITION_DECO_ITEMS.forEach((_, index) => {
      const delay = SAVE_TRANSITION_DECO_INITIAL_DELAY_MS + index * SAVE_TRANSITION_DECO_STEP_MS;
      timers.push(
        window.setTimeout(() => {
          if (!cancelled) setVisibleCount(index + 1);
        }, delay),
      );
    });

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  return (
    <div
      className="mx-auto flex h-16 w-[min(100%,13.5rem)] items-end justify-center gap-3 sm:gap-4"
      aria-hidden
    >
      {SAVE_TRANSITION_DECO_ITEMS.map((item, index) => {
        const visible = index < visibleCount;
        return (
          <div
            key={item.key}
            className={`flex h-14 w-14 shrink-0 items-end justify-center ${
              visible ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- 先読み済み img でぱっと表示 */}
            <img
              src={item.src}
              alt=""
              width={56}
              height={56}
              decoding="sync"
              className="max-h-14 max-w-14 object-contain object-bottom"
            />
          </div>
        );
      })}
    </div>
  );
}
