"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";

import {
  FIRST_VISIT_ABOUT_VIDEO_NEXT_LABEL,
  FIRST_VISIT_ABOUT_VIDEO_POSTER_SRC,
  FIRST_VISIT_ABOUT_VIDEO_REPLAY_LABEL,
  FIRST_VISIT_ABOUT_VIDEO_SKIP_LABEL,
  FIRST_VISIT_ABOUT_VIDEO_SKIP_NOTE,
  FIRST_VISIT_ABOUT_VIDEO_SRC,
  FIRST_VISIT_ABOUT_VIDEO_START_LABEL,
} from "@/lib/onboarding/firstVisitWizard/aboutVideo";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";

type PlaybackPhase = "ready" | "playing" | "ended";

/** 第2幕：Life Journey Diaryとは（リール動画・全画面） */
export function FirstVisitAboutPage() {
  const [phase, setPhase] = useState<PlaybackPhase>("ready");
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

  const skipHref = FIRST_VISIT_ROUTES.owl;

  return (
    <section
      className="relative min-h-[100dvh] overflow-hidden bg-[#141210]"
      aria-labelledby="first-visit-about-heading"
    >
      <h1 id="first-visit-about-heading" className="sr-only">
        はじめての方へ — Life Journey Diaryとは
      </h1>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-full w-full lg:h-full lg:w-auto lg:max-w-[min(100vw,calc(100dvh*9/16))]">
          <video
            ref={videoRef}
            src={FIRST_VISIT_ABOUT_VIDEO_SRC}
            poster={FIRST_VISIT_ABOUT_VIDEO_POSTER_SRC}
            className={[
              "h-full w-full object-cover object-center lg:object-contain",
              phase === "ready" ? "invisible" : "visible",
            ].join(" ")}
            playsInline
            preload="metadata"
            onEnded={() => setPhase("ended")}
          />
          {phase === "ready" ? (
            <Image
              src={FIRST_VISIT_ABOUT_VIDEO_POSTER_SRC}
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-center lg:object-contain"
              priority
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
            aria-label={FIRST_VISIT_ABOUT_VIDEO_START_LABEL}
          >
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full bg-white/92 pl-1 text-xl text-emerald-800 shadow-[0_8px_28px_-8px_rgba(0,0,0,0.45)] ring-1 ring-white/60 transition group-hover:scale-105 group-active:scale-95"
              aria-hidden
            >
              ▶
            </span>
            <span className="rounded-full bg-emerald-800/88 px-5 py-2 text-base font-medium text-white shadow-[0_8px_28px_-8px_rgba(24,83,53,0.45)] backdrop-blur-[2px] ring-1 ring-white/20">
              {FIRST_VISIT_ABOUT_VIDEO_START_LABEL}
            </span>
          </button>
        </div>
      ) : null}

      {phase === "ready" || phase === "ended" ? (
        <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-1 px-4 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-6 text-center">
          <Link
            href={skipHref}
            className="text-xs text-white/65 underline-offset-2 hover:text-white/85 hover:underline"
          >
            {FIRST_VISIT_ABOUT_VIDEO_SKIP_LABEL}
          </Link>
          <p className="max-w-sm text-xs leading-relaxed text-white/70">{FIRST_VISIT_ABOUT_VIDEO_SKIP_NOTE}</p>
        </div>
      ) : null}

      {phase === "ended" ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-3 px-4 pb-[max(4.75rem,env(safe-area-inset-bottom))] pt-10">
          <button
            type="button"
            onClick={handleReplay}
            className="pointer-events-auto inline-flex min-h-[48px] w-full max-w-sm items-center justify-center rounded-xl border border-white/25 bg-black/45 px-5 py-3 text-base font-medium text-white shadow-[0_8px_28px_-8px_rgba(0,0,0,0.35)] backdrop-blur-[2px] transition hover:bg-black/55 active:bg-black/65"
          >
            {FIRST_VISIT_ABOUT_VIDEO_REPLAY_LABEL}
          </button>
          <Link
            href={FIRST_VISIT_ROUTES.owl}
            className="pointer-events-auto inline-flex min-h-[48px] w-full max-w-sm items-center justify-center rounded-xl border border-emerald-900/15 bg-emerald-800/82 px-5 py-3 text-base font-medium text-white shadow-[0_8px_28px_-8px_rgba(24,83,53,0.45)] backdrop-blur-[2px] transition hover:bg-emerald-900/88 active:bg-emerald-900/92"
          >
            {FIRST_VISIT_ABOUT_VIDEO_NEXT_LABEL}
          </Link>
        </div>
      ) : null}
    </section>
  );
}
