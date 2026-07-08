"use client";

import { useCallback, useRef, useState } from "react";

import {
  FIRST_VISIT_RESIDENT_CARD_VIDEO_POSTER_SRC,
  FIRST_VISIT_RESIDENT_CARD_VIDEO_REPLAY_LABEL,
  FIRST_VISIT_RESIDENT_CARD_VIDEO_SKIP_LABEL,
  FIRST_VISIT_RESIDENT_CARD_VIDEO_SRC,
  FIRST_VISIT_RESIDENT_CARD_VIDEO_START_LABEL,
} from "@/lib/onboarding/firstVisitWizard/residentCardVideo";

type PlaybackPhase = "ready" | "playing" | "ended";

type Props = {
  onComplete: () => void;
};

/** 住民票カード発行の演出動画（全画面） */
export function FirstVisitResidentCardVideoStage({ onComplete }: Props) {
  const [phase, setPhase] = useState<PlaybackPhase>("ready");
  const [posterVisible, setPosterVisible] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleStart = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setPhase("playing");
    void video.play();
  }, []);

  const handleReplay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setPhase("playing");
    video.currentTime = 0;
    void video.play();
  }, []);

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  return (
    <section
      className="relative h-[100dvh] min-h-[100dvh] overflow-hidden bg-[#141210]"
      aria-labelledby="first-visit-resident-card-video-heading"
    >
      <h1 id="first-visit-resident-card-video-heading" className="sr-only">
        住民票カードを発行しています
      </h1>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-full w-full lg:h-full lg:w-auto lg:max-w-[min(100vw,calc(100dvh*9/16))]">
          <video
            ref={videoRef}
            src={FIRST_VISIT_RESIDENT_CARD_VIDEO_SRC}
            poster={FIRST_VISIT_RESIDENT_CARD_VIDEO_POSTER_SRC}
            className={[
              "h-full w-full object-cover object-center lg:object-contain",
              phase === "ready" ? "invisible" : "visible",
            ].join(" ")}
            playsInline
            preload="metadata"
            onEnded={() => setPhase("ended")}
          />
          {phase === "ready" && posterVisible ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={FIRST_VISIT_RESIDENT_CARD_VIDEO_POSTER_SRC}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center lg:object-contain"
              onError={() => setPosterVisible(false)}
            />
          ) : null}
        </div>
      </div>

      {phase === "ready" ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 px-6">
          <button
            type="button"
            onClick={handleStart}
            className="group flex flex-col items-center gap-3 rounded-2xl px-6 py-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            aria-label={FIRST_VISIT_RESIDENT_CARD_VIDEO_START_LABEL}
          >
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full bg-white/92 pl-1 text-xl text-emerald-800 shadow-[0_8px_28px_-8px_rgba(0,0,0,0.45)] ring-1 ring-white/60 transition group-hover:scale-105 group-active:scale-95"
              aria-hidden
            >
              ▶
            </span>
            <span className="rounded-full bg-emerald-800/88 px-5 py-2 text-base font-medium text-white shadow-[0_8px_28px_-8px_rgba(24,83,53,0.45)] backdrop-blur-[2px] ring-1 ring-white/20">
              {FIRST_VISIT_RESIDENT_CARD_VIDEO_START_LABEL}
            </span>
          </button>
        </div>
      ) : null}

      {phase === "ready" || phase === "playing" ? (
        <div className="absolute inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-6">
          <button
            type="button"
            onClick={handleComplete}
            className="text-xs text-white/65 underline-offset-2 hover:text-white/85 hover:underline"
          >
            {FIRST_VISIT_RESIDENT_CARD_VIDEO_SKIP_LABEL}
          </button>
        </div>
      ) : null}

      {phase === "ended" ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-3 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-10">
          <button
            type="button"
            onClick={handleReplay}
            className="pointer-events-auto inline-flex min-h-[48px] w-full max-w-sm items-center justify-center rounded-xl border border-white/25 bg-black/45 px-5 py-3 text-base font-medium text-white shadow-[0_8px_28px_-8px_rgba(0,0,0,0.35)] backdrop-blur-[2px] transition hover:bg-black/55 active:bg-black/65"
          >
            {FIRST_VISIT_RESIDENT_CARD_VIDEO_REPLAY_LABEL}
          </button>
          <button
            type="button"
            onClick={handleComplete}
            className="pointer-events-auto inline-flex min-h-[48px] w-full max-w-sm items-center justify-center rounded-xl border border-emerald-900/15 bg-emerald-800/82 px-5 py-3 text-base font-medium text-white shadow-[0_8px_28px_-8px_rgba(24,83,53,0.45)] backdrop-blur-[2px] transition hover:bg-emerald-900/88 active:bg-emerald-900/92"
          >
            カードを見る
          </button>
        </div>
      ) : null}
    </section>
  );
}
