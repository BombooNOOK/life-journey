"use client";

import { useLayoutEffect, useState } from "react";

import { GARDEN_WATERING_FX_LABEL } from "@/lib/garden/gardenCopy";
import {
  GARDEN_WATERING_FX_BEAT_MS,
  GARDEN_WATERING_FX_BEATS,
  gardenWateringFxSrc,
  preloadGardenWateringFxAssets,
  type GardenWateringFxBeat,
} from "@/lib/garden/gardenWateringTransition";

/** 生成り寄りのカード色（日記保存演出のデフォルトより少し温かめ） */
const KINARI_CARD = {
  borderColor: "rgba(186, 164, 132, 0.58)",
  backgroundColor: "rgba(255, 250, 242, 0.97)",
  topAccent: "rgba(196, 170, 132, 0.72)",
} as const;

type Props = {
  onComplete: () => void;
};

/**
 * ジョウロタップ直後：生成りカード＋ジョウロ画像をぱっ・ぱっと切替。
 * 通常→水→通常→水→通常。
 */
export function GardenWateringTransitionOverlay({ onComplete }: Props) {
  const [beatIndex, setBeatIndex] = useState(0);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    void preloadGardenWateringFxAssets().then(() => {
      if (cancelled) return;
      setReady(true);

      let index = 0;
      const advance = () => {
        if (cancelled) return;
        index += 1;
        if (index >= GARDEN_WATERING_FX_BEATS.length) {
          onComplete();
          return;
        }
        setBeatIndex(index);
        timer = window.setTimeout(advance, GARDEN_WATERING_FX_BEAT_MS);
      };

      timer = window.setTimeout(advance, GARDEN_WATERING_FX_BEAT_MS);
    });

    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [onComplete]);

  const beat: GardenWateringFxBeat =
    GARDEN_WATERING_FX_BEATS[beatIndex] ?? GARDEN_WATERING_FX_BEATS[0];
  const src = gardenWateringFxSrc(beat);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#f3ebe2]/72 px-4 backdrop-blur-[1px]"
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      <div className="relative z-10 w-full max-w-sm">
        <div
          className="overflow-hidden rounded-2xl shadow-[0_14px_44px_rgba(80,62,44,0.14)]"
          style={{
            borderWidth: 1.5,
            borderStyle: "solid",
            borderColor: KINARI_CARD.borderColor,
            backgroundColor: KINARI_CARD.backgroundColor,
          }}
        >
          <div className="h-1.5" style={{ backgroundColor: KINARI_CARD.topAccent }} />
          <div className="flex flex-col items-center px-6 pb-8 pt-7">
            <p className="text-center text-[15px] font-medium leading-7 tracking-wide text-stone-800">
              {GARDEN_WATERING_FX_LABEL}
            </p>
            <div className="mt-5 flex h-[11.5rem] w-full items-center justify-center">
              {ready ? (
                // eslint-disable-next-line @next/next/no-img-element -- 先読み済み img でコマ切替
                <img
                  key={beatIndex}
                  src={src}
                  alt=""
                  width={480}
                  height={480}
                  decoding="sync"
                  className="h-full w-auto max-w-[11.5rem] object-contain"
                />
              ) : (
                <div className="h-[11.5rem] w-[11.5rem]" aria-hidden />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
