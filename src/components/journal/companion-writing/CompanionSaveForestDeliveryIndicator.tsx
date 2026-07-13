"use client";

import { COMPANION_SAVE_FOREST_FRAMES } from "@/lib/journal/companionWriting/companionSaveForestAssets";

type Props = {
  /** 左から何枚まで表示するか（親の届け文言と同期） */
  visibleCount: number;
};

/** 伴走保存後：日記ブック3枚が左・中・右へ順番に現れる（きのこ演出と同型） */
export function CompanionSaveForestDeliveryIndicator({ visibleCount }: Props) {
  return (
    <div
      className="mx-auto flex h-24 w-full max-w-[21rem] items-end justify-center gap-1.5 sm:h-28 sm:max-w-[24rem] sm:gap-2"
      aria-hidden
    >
      {COMPANION_SAVE_FOREST_FRAMES.map((frame, index) => {
        const visible = index < visibleCount;
        return (
          <div
            key={frame.key}
            className={`flex h-[5.5rem] w-[5.5rem] shrink-0 items-end justify-center sm:h-24 sm:w-24 ${
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
              className="max-h-full max-w-full object-contain object-bottom"
            />
          </div>
        );
      })}
    </div>
  );
}
