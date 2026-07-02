"use client";

import { useLayoutEffect, useState } from "react";

import {
  COMPANION_SAVE_FOREST_FRAMES,
  COMPANION_SAVE_FOREST_FRAME_STEP_MS,
} from "@/lib/journal/companionWriting/companionSaveForestAssets";

/** 伴走保存後：日記ブック3コマが順番に切り替わる */
export function CompanionSaveForestDeliveryIndicator() {
  const [frameIndex, setFrameIndex] = useState(-1);

  useLayoutEffect(() => {
    let cancelled = false;
    const timers: number[] = [];

    const showLastFrame = () => {
      if (!cancelled) {
        setFrameIndex(COMPANION_SAVE_FOREST_FRAMES.length - 1);
      }
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      showLastFrame();
      return () => {
        cancelled = true;
      };
    }

    COMPANION_SAVE_FOREST_FRAMES.forEach((_, index) => {
      timers.push(
        window.setTimeout(() => {
          if (!cancelled) setFrameIndex(index);
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
      className="relative mx-auto h-44 w-full max-w-[18rem] sm:h-48 sm:max-w-[20rem]"
      aria-hidden
    >
      {COMPANION_SAVE_FOREST_FRAMES.map((frame, index) => {
        const visible = index === frameIndex;
        return (
          <div
            key={frame.key}
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-150 ${
              visible ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- 先読み済み img でぱっと表示 */}
            <img
              src={frame.src}
              alt=""
              width={752}
              height={752}
              decoding="sync"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        );
      })}
    </div>
  );
}
