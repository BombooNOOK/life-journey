"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { buildLoginHref } from "@/app/login/loginFlow";
import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { useTransitionNavigation } from "@/components/ui/TransitionNavigationProvider";
import { OwlLoadingPanel } from "@/components/ui/OwlLoadingPanel";
import {
  FIRST_VISIT_LOGHOUSE_BUILD_VIDEO_NEXT_LABEL,
  FIRST_VISIT_LOGHOUSE_BUILD_VIDEO_POSTER_SRC,
  FIRST_VISIT_LOGHOUSE_BUILD_VIDEO_REPLAY_LABEL,
  FIRST_VISIT_LOGHOUSE_BUILD_VIDEO_SRC,
  FIRST_VISIT_LOGHOUSE_BUILD_VIDEO_START_LABEL,
} from "@/lib/onboarding/firstVisitWizard/loghouseBuildVideo";
import { preloadFirstVisitLoghouseCompleteIllustration } from "@/lib/onboarding/firstVisitWizard/loghouseCompleteCopy";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import { clearFirstVisitFromRegisterFlag } from "@/lib/onboarding/firstVisitWizard/session";

type PlaybackPhase = "ready" | "playing" | "ended";

/** 第5幕：ログハウス建築（全画面動画） */
export function FirstVisitLoghousePage() {
  const router = useRouter();
  const { replace } = useTransitionNavigation();
  const { user, loading } = useFirebaseAuth();
  const isLoggedIn = Boolean(user?.email?.trim());
  const [phase, setPhase] = useState<PlaybackPhase>("ready");
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (loading) return;
    if (!isLoggedIn) {
      router.replace(buildLoginHref(FIRST_VISIT_ROUTES.loghouse, "login"));
    }
  }, [isLoggedIn, loading, router]);

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

  const handleNext = useCallback(() => {
    clearFirstVisitFromRegisterFlag();
    void preloadFirstVisitLoghouseCompleteIllustration();
    replace(FIRST_VISIT_ROUTES.kantei);
  }, [replace]);

  if (loading || !isLoggedIn) {
    return (
      <OwlLoadingPanel
        layout="page"
        label="ログイン状態を確認しています…"
        hint="フクロウが回っているあいだはそのままお待ちください。"
      />
    );
  }

  return (
    <section
      className="relative h-[100dvh] min-h-[100dvh] overflow-hidden bg-[#141210]"
      aria-labelledby="first-visit-loghouse-heading"
    >
      <h1 id="first-visit-loghouse-heading" className="sr-only">
        はじめての方へ — ログハウスを建てる
      </h1>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-full w-full lg:h-full lg:w-auto lg:max-w-[min(100vw,calc(100dvh*9/16))]">
          <video
            ref={videoRef}
            src={FIRST_VISIT_LOGHOUSE_BUILD_VIDEO_SRC}
            poster={FIRST_VISIT_LOGHOUSE_BUILD_VIDEO_POSTER_SRC}
            className={[
              "h-full w-full object-cover object-center lg:object-contain",
              phase === "ready" ? "invisible" : "visible",
            ].join(" ")}
            playsInline
            preload="metadata"
            onEnded={() => setPhase("ended")}
            onError={() => setVideoError(true)}
          />
          {phase === "ready" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={FIRST_VISIT_LOGHOUSE_BUILD_VIDEO_POSTER_SRC}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center lg:object-contain"
            />
          ) : null}
        </div>
      </div>

      {videoError ? (
        <div className="absolute inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-30 px-4">
          <p className="mx-auto max-w-md rounded-xl border border-amber-200/80 bg-amber-50/95 px-4 py-3 text-center text-sm text-amber-950 shadow-sm">
            建築の動画を読み込めませんでした。通信環境を確認するか、そのまま「次へ」で進んでください。
          </p>
        </div>
      ) : null}

      {phase === "ready" ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 px-6">
          <button
            type="button"
            onClick={handleStart}
            className="group flex flex-col items-center gap-3 rounded-2xl px-6 py-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            aria-label={FIRST_VISIT_LOGHOUSE_BUILD_VIDEO_START_LABEL}
          >
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full bg-white/92 pl-1 text-xl text-emerald-800 shadow-[0_8px_28px_-8px_rgba(0,0,0,0.45)] ring-1 ring-white/60 transition group-hover:scale-105 group-active:scale-95"
              aria-hidden
            >
              ▶
            </span>
            <span className="rounded-full bg-emerald-800/88 px-5 py-2 text-base font-medium text-white shadow-[0_8px_28px_-8px_rgba(24,83,53,0.45)] backdrop-blur-[2px] ring-1 ring-white/20">
              {FIRST_VISIT_LOGHOUSE_BUILD_VIDEO_START_LABEL}
            </span>
          </button>
        </div>
      ) : null}

      {phase === "ended" || videoError ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-3 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-10">
          <button
            type="button"
            onClick={handleReplay}
            className="pointer-events-auto inline-flex min-h-[48px] w-full max-w-sm items-center justify-center rounded-xl border border-white/25 bg-black/45 px-5 py-3 text-base font-medium text-white shadow-[0_8px_28px_-8px_rgba(0,0,0,0.35)] backdrop-blur-[2px] transition hover:bg-black/55 active:bg-black/65"
          >
            {FIRST_VISIT_LOGHOUSE_BUILD_VIDEO_REPLAY_LABEL}
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="pointer-events-auto inline-flex min-h-[48px] w-full max-w-sm items-center justify-center rounded-xl border border-emerald-900/15 bg-emerald-800/82 px-5 py-3 text-base font-medium text-white shadow-[0_8px_28px_-8px_rgba(24,83,53,0.45)] backdrop-blur-[2px] transition hover:bg-emerald-900/88 active:bg-emerald-900/92"
          >
            {FIRST_VISIT_LOGHOUSE_BUILD_VIDEO_NEXT_LABEL}
          </button>
        </div>
      ) : null}
    </section>
  );
}
