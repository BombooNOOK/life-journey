"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

type Props = {
  src: string;
  /** 未再生時に見せる画像（iPhone の真っ黒／標準UIのグレー幕を避ける） */
  posterUrl?: string | null;
  className?: string;
  videoClassName?: string;
  muted?: boolean;
  /** 再生開始時（BGMプリビュー停止など） */
  onPlay?: () => void;
  /** アクセシブル名 */
  label?: string;
};

/**
 * iOS 標準 controls のグレー幕を出さず、タップで再生／一時停止する短い動画向けプレイヤー。
 */
export function HitoyasumiSoftVideoPlayer({
  src,
  posterUrl = null,
  className = "",
  videoClassName = "h-full w-full object-contain",
  muted = false,
  onPlay,
  label = "動画を再生",
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  /** 一度再生したらポスターではなく一時停止フレームを見せる */
  const [hasPlayed, setHasPlayed] = useState(false);
  const labelId = useId();

  useEffect(() => {
    setPlaying(false);
    setBusy(false);
    setHasPlayed(false);
    const video = videoRef.current;
    if (!video) return;
    try {
      video.pause();
      video.currentTime = 0;
    } catch {
      // ignore
    }
  }, [src]);

  /** iPhone で未再生フレームが真っ黒な端末向けに、わずかに seek して1コマ描画を促す */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;

    const paint = async () => {
      try {
        if (cancelled || !video.paused) return;
        const duration = Number.isFinite(video.duration) ? video.duration : 0;
        const target = duration > 0.2 ? Math.min(0.12, duration * 0.02) : 0.01;
        if (Math.abs(video.currentTime - target) < 0.001) return;
        await new Promise<void>((resolve, reject) => {
          const t = window.setTimeout(() => {
            cleanup();
            reject(new Error("seek timeout"));
          }, 4000);
          const onSeeked = () => {
            cleanup();
            resolve();
          };
          const cleanup = () => {
            window.clearTimeout(t);
            video.removeEventListener("seeked", onSeeked);
          };
          video.addEventListener("seeked", onSeeked, { once: true });
          video.currentTime = target;
        });
      } catch {
        // ignore — poster があればそちらを表示
      }
    };

    const onLoaded = () => {
      void paint();
    };
    if (video.readyState >= 2) void paint();
    else video.addEventListener("loadeddata", onLoaded, { once: true });
    return () => {
      cancelled = true;
      video.removeEventListener("loadeddata", onLoaded);
    };
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlayEv = () => {
      setPlaying(true);
      setHasPlayed(true);
    };
    const onPauseEv = () => setPlaying(false);
    const onEndedEv = () => {
      setPlaying(false);
      setHasPlayed(false);
      try {
        video.currentTime = 0;
      } catch {
        // ignore
      }
    };
    video.addEventListener("play", onPlayEv);
    video.addEventListener("pause", onPauseEv);
    video.addEventListener("ended", onEndedEv);
    return () => {
      video.removeEventListener("play", onPlayEv);
      video.removeEventListener("pause", onPauseEv);
      video.removeEventListener("ended", onEndedEv);
    };
  }, [src]);

  const toggle = useCallback(async () => {
    const video = videoRef.current;
    if (!video || busy) return;
    setBusy(true);
    try {
      if (video.paused || video.ended) {
        onPlay?.();
        await video.play();
      } else {
        video.pause();
      }
    } catch {
      setPlaying(false);
    } finally {
      setBusy(false);
    }
  }, [busy, onPlay]);

  const showPoster = Boolean(posterUrl) && !playing && !hasPlayed;

  return (
    <div className={["relative overflow-hidden bg-[#1a120c]", className].join(" ")}>
      <video
        ref={videoRef}
        src={src}
        playsInline
        preload="auto"
        muted={muted}
        controls={false}
        disablePictureInPicture
        className={[
          videoClassName,
          showPoster ? "opacity-0" : "opacity-100",
        ].join(" ")}
        aria-labelledby={labelId}
      />
      {showPoster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={posterUrl!}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
        />
      ) : null}

      <button
        type="button"
        id={labelId}
        onClick={() => void toggle()}
        aria-label={playing ? "一時停止" : label}
        className={[
          "absolute inset-0 z-[1] flex items-center justify-center",
          playing ? "bg-transparent" : "bg-black/10",
        ].join(" ")}
      >
        {!playing ? (
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/85 bg-white/95 text-[#1a120c] shadow-lg">
            <svg aria-hidden className="ml-0.5 h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5.5v13l11-6.5L8 5.5z" />
            </svg>
          </span>
        ) : (
          <span className="sr-only">再生中。タップで一時停止</span>
        )}
      </button>
    </div>
  );
}
