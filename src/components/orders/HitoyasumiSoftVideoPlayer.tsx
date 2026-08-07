"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

type Props = {
  src: string;
  /** 未再生時に見せる画像（取れた場合） */
  posterUrl?: string | null;
  className?: string;
  videoClassName?: string;
  muted?: boolean;
  /** マウント時に mute 再生→停止で1コマ描画（iPhone の選択直後真っ黒対策） */
  autoPrime?: boolean;
  onPlay?: () => void;
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
  autoPrime = true,
  onPlay,
  label = "動画を再生",
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const primingRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [primed, setPrimed] = useState(false);
  const labelId = useId();
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  useEffect(() => {
    setPlaying(false);
    setBusy(false);
    setHasPlayed(false);
    setPrimed(false);
    primingRef.current = false;
    const video = videoRef.current;
    if (!video) return;
    try {
      video.pause();
      video.currentTime = 0;
    } catch {
      // ignore
    }
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!primingRef.current) video.muted = muted;
  }, [muted, src]);

  useEffect(() => {
    if (!autoPrime) {
      setPrimed(true);
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;

    const prime = async () => {
      primingRef.current = true;
      try {
        video.muted = true;
        video.playsInline = true;
        video.setAttribute("playsinline", "");
        video.setAttribute("webkit-playsinline", "");

        if (video.readyState < 2) {
          await new Promise<void>((resolve, reject) => {
            const t = window.setTimeout(() => {
              cleanup();
              reject(new Error("loadeddata timeout"));
            }, 12_000);
            const onOk = () => {
              cleanup();
              resolve();
            };
            const onErr = () => {
              cleanup();
              reject(new Error("media error"));
            };
            const cleanup = () => {
              window.clearTimeout(t);
              video.removeEventListener("loadeddata", onOk);
              video.removeEventListener("error", onErr);
            };
            video.addEventListener("loadeddata", onOk, { once: true });
            video.addEventListener("error", onErr, { once: true });
          });
        }
        if (cancelled) return;

        try {
          const p = video.play();
          if (p) await p;
          // ごく短くデコードさせてから止める
          await new Promise((r) => window.setTimeout(r, 80));
        } catch {
          // seek のみで続行
        }
        if (cancelled) return;
        video.pause();

        const duration = Number.isFinite(video.duration) ? video.duration : 0;
        const target = duration > 0.2 ? Math.min(0.15, duration * 0.03) : 0.05;
        try {
          await new Promise<void>((resolve) => {
            const t = window.setTimeout(() => {
              cleanup();
              resolve();
            }, 2500);
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
          // ignore
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) {
          video.muted = mutedRef.current;
          primingRef.current = false;
          setPlaying(false);
          setPrimed(true);
        }
      }
    };

    void prime();
    return () => {
      cancelled = true;
      primingRef.current = false;
      try {
        video.pause();
        video.muted = mutedRef.current;
      } catch {
        // ignore
      }
    };
  }, [autoPrime, src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlayEv = () => {
      if (primingRef.current) return;
      setPlaying(true);
      setHasPlayed(true);
    };
    const onPauseEv = () => {
      if (primingRef.current) return;
      setPlaying(false);
    };
    const onEndedEv = () => {
      if (primingRef.current) return;
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
    if (!video || busy || primingRef.current) return;
    setBusy(true);
    try {
      if (video.paused || video.ended) {
        video.muted = mutedRef.current;
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
  const showLoading = !showPoster && !primed && !playing;
  const hideVideo = showPoster || showLoading;

  return (
    <div className={["relative overflow-hidden bg-[#1a120c] [touch-action:manipulation]", className].join(" ")}>
      <video
        ref={videoRef}
        src={src}
        playsInline
        preload="auto"
        muted={muted}
        controls={false}
        disablePictureInPicture
        className={[videoClassName, hideVideo ? "opacity-0" : "opacity-100"].join(" ")}
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

      {showLoading ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#2a221a]/55">
          <p className="text-xs text-[#d9cbb8]">動画を読み込んでいます…</p>
        </div>
      ) : null}

      <button
        type="button"
        id={labelId}
        onClick={() => void toggle()}
        aria-label={playing ? "一時停止" : label}
        className="absolute inset-0 z-[1] flex items-center justify-center bg-transparent"
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
