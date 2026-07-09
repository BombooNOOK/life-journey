"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  FIRST_VISIT_PATH_GUIDE_ASSETS,
  FIRST_VISIT_PATH_GUIDE_IMAGE_SIZES,
  FIRST_VISIT_PATH_GUIDE_PROLOGUE_CARD_SIZE,
} from "@/lib/onboarding/firstVisitWizard/pathGuideAssets";
import {
  pathGuideCardContainerClass,
  pathGuideCardTextClass,
  pathGuideCardTextOverlayClass,
} from "@/lib/onboarding/firstVisitWizard/pathGuideCardText";
import {
  FIRST_VISIT_PATH_GUIDE_PROLOGUE_CLOSE_LABEL,
  FIRST_VISIT_PATH_GUIDE_PROLOGUE_HEADING,
  FIRST_VISIT_PATH_GUIDE_PROLOGUE_REPLAY_LABEL,
  FIRST_VISIT_PATH_GUIDE_PROLOGUE_TITLE,
  FIRST_VISIT_PATH_GUIDE_PROLOGUE_VIDEO_POSTER_SRC,
  FIRST_VISIT_PATH_GUIDE_PROLOGUE_VIDEO_SRC,
  FIRST_VISIT_PATH_GUIDE_PROLOGUE_WATCH_LABEL,
} from "@/lib/onboarding/firstVisitWizard/pathGuidePrologue";

type Props = {
  watched: boolean;
  onWatched: () => void;
  className?: string;
};

type PlaybackPhase = "idle" | "playing" | "ended";

const overlayPrimaryClass =
  "inline-flex min-h-[44px] w-full max-w-xs items-center justify-center rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-900";

/** プロローグカード全体が動画ボタン。再生は全画面 */
export function FirstVisitPathGuidePrologueCard({ watched, onWatched, className = "" }: Props) {
  const [phase, setPhase] = useState<PlaybackPhase>("idle");
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const closePlayer = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    setOpen(false);
    setPhase("idle");
  }, []);

  const handleWatch = useCallback(() => {
    setOpen(true);
    setPhase("playing");
  }, []);

  const handleReplay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setPhase("playing");
    video.currentTime = 0;
    void video.play();
  }, []);

  const handleEnded = useCallback(() => {
    setPhase("ended");
    onWatched();
  }, [onWatched]);

  useEffect(() => {
    if (!open) return;
    const video = videoRef.current;
    if (!video) return;
    void video.play().catch(() => {
      setPhase("idle");
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePlayer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closePlayer, open]);

  return (
    <>
      <button
        type="button"
        onClick={handleWatch}
        className={[
          pathGuideCardContainerClass,
          "transition active:scale-[0.99]",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Image
          src={FIRST_VISIT_PATH_GUIDE_ASSETS.cardPrologue}
          alt=""
          width={FIRST_VISIT_PATH_GUIDE_PROLOGUE_CARD_SIZE.widthPx}
          height={FIRST_VISIT_PATH_GUIDE_PROLOGUE_CARD_SIZE.heightPx}
          sizes={FIRST_VISIT_PATH_GUIDE_IMAGE_SIZES}
          className="h-auto w-full"
          priority
        />
        <div className={pathGuideCardTextOverlayClass}>
          <div className="min-w-0 text-left">
            <p className={`${pathGuideCardTextClass.label} text-emerald-900/75`}>
              {FIRST_VISIT_PATH_GUIDE_PROLOGUE_TITLE}
            </p>
            <h2 className={`${pathGuideCardTextClass.titleOneLine} text-[#4a3728]`}>
              {FIRST_VISIT_PATH_GUIDE_PROLOGUE_HEADING}
            </h2>
            <p className={`${pathGuideCardTextClass.action} text-emerald-900/85`}>
              {watched
                ? `${FIRST_VISIT_PATH_GUIDE_PROLOGUE_REPLAY_LABEL} →`
                : `${FIRST_VISIT_PATH_GUIDE_PROLOGUE_WATCH_LABEL} →`}
            </p>
          </div>
        </div>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center bg-black/92"
          role="dialog"
          aria-modal="true"
          aria-label={FIRST_VISIT_PATH_GUIDE_PROLOGUE_HEADING}
        >
          <div className="relative flex h-full w-full max-w-lg flex-col">
            <video
              ref={videoRef}
              src={FIRST_VISIT_PATH_GUIDE_PROLOGUE_VIDEO_SRC}
              poster={FIRST_VISIT_PATH_GUIDE_PROLOGUE_VIDEO_POSTER_SRC}
              playsInline
              controls={phase === "playing"}
              className="h-full w-full object-contain"
              onEnded={handleEnded}
            />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-16">
              {phase === "ended" ? (
                <>
                  <button type="button" className={`${overlayPrimaryClass} pointer-events-auto`} onClick={handleReplay}>
                    {FIRST_VISIT_PATH_GUIDE_PROLOGUE_REPLAY_LABEL}
                  </button>
                  <button
                    type="button"
                    className={`${overlayPrimaryClass} pointer-events-auto border border-white/40 bg-black/35 backdrop-blur-sm hover:bg-black/50`}
                    onClick={closePlayer}
                  >
                    {FIRST_VISIT_PATH_GUIDE_PROLOGUE_CLOSE_LABEL}
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
