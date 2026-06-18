"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  LJD_INTRO_VIDEO_POSTER_SRC,
  LJD_INTRO_VIDEO_SRC,
} from "@/lib/home/ljdIntroVideo";

/** タップ後にのみ読み込む・再生する紹介動画プレイヤー */
export function LjdIntroVideoPlayer() {
  const [started, setStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleStart = useCallback(() => {
    setStarted(true);
  }, []);

  useEffect(() => {
    if (!started) return;
    const video = videoRef.current;
    if (!video) return;

    const play = () => {
      void video.play();
    };

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      play();
      return;
    }

    video.addEventListener("loadeddata", play, { once: true });
    return () => video.removeEventListener("loadeddata", play);
  }, [started]);

  return (
    <div className="mx-auto w-full max-w-[min(17.5rem,78vw)]">
      {!started ? (
        <button
          type="button"
          onClick={handleStart}
          className="group relative block w-full overflow-hidden rounded-xl border border-stone-200/80 bg-[#f3ebe0] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          aria-label="LJDの流れを約20秒の動画で見る"
        >
          <div className="relative aspect-[9/16] w-full">
            <Image
              src={LJD_INTRO_VIDEO_POSTER_SRC}
              alt=""
              fill
              sizes="(max-width: 640px) 78vw, 280px"
              className="object-cover object-center"
              priority={false}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#fffdf9]/10 via-transparent to-[#f6f4ef]/35" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-4">
              <span
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white/92 pl-0.5 text-lg text-emerald-800 shadow-md ring-1 ring-stone-200/80 transition group-hover:scale-105 group-active:scale-95"
                aria-hidden
              >
                ▶
              </span>
              <span className="rounded-full bg-white/90 px-3.5 py-1 text-xs font-semibold text-emerald-900 ring-1 ring-stone-200/70">
                動画を見る
              </span>
            </div>
          </div>
        </button>
      ) : (
        <video
          ref={videoRef}
          className="aspect-[9/16] w-full rounded-xl border border-stone-200/80 bg-[#1a1a1a] object-contain shadow-sm"
          controls
          playsInline
          muted
          preload="auto"
          src={LJD_INTRO_VIDEO_SRC}
        />
      )}
    </div>
  );
}
