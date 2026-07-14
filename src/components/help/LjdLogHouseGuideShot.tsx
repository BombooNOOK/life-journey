"use client";

import Image from "next/image";

import {
  LJD_LOG_HOUSE_GUIDE_MARKERS,
  LJD_LOG_HOUSE_GUIDE_SHOT_INTRINSIC,
  LJD_LOG_HOUSE_GUIDE_SHOT_SRC,
} from "@/lib/help/ljdLogHouseGuideAnnotate";

/** 案内所：ログハウス室内スクショ＋番号注釈（リンクなし） */
export function LjdLogHouseGuideShot() {
  const aspectRatio = `${LJD_LOG_HOUSE_GUIDE_SHOT_INTRINSIC.widthPx} / ${LJD_LOG_HOUSE_GUIDE_SHOT_INTRINSIC.heightPx}`;

  return (
    <div className="space-y-4">
      <div
        className="relative mx-auto w-full max-w-[18rem] overflow-hidden rounded-xl border border-stone-200/90 bg-[#ebe4d4] shadow-sm sm:max-w-[20rem]"
        style={{ aspectRatio }}
      >
        <Image
          src={LJD_LOG_HOUSE_GUIDE_SHOT_SRC}
          alt="ログハウスの室内。住民票・本棚・机・今日の鑑定結果・ラジカセ・うさぎ・ポスト・靴におでかけの番号が付いています。"
          fill
          sizes="(max-width: 640px) 72vw, 20rem"
          className="object-cover object-top"
          unoptimized
        />

        {LJD_LOG_HOUSE_GUIDE_MARKERS.map((marker) => (
          <span
            key={marker.id}
            className="pointer-events-none absolute z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/72 text-[13px] font-bold tabular-nums text-stone-800 shadow-sm backdrop-blur-[1px] sm:h-8 sm:w-8 sm:text-sm"
            style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
            aria-hidden
          >
            {marker.number}
          </span>
        ))}
      </div>

      <ol className="space-y-3 text-sm leading-relaxed text-stone-700">
        {LJD_LOG_HOUSE_GUIDE_MARKERS.map((marker) => (
          <li key={marker.id} className="flex gap-2.5">
            <span
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-stone-200/80 bg-white/90 text-xs font-bold tabular-nums text-stone-800"
              aria-hidden
            >
              {marker.number}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-stone-900">
                <span className="sr-only">{marker.number}.</span>
                {marker.title}
              </p>
              <p className="mt-0.5 text-stone-600">{marker.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
