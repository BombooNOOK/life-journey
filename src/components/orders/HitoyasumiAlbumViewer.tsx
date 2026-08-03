"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  formatHitoyasumiCreatedAt,
  hitoyasumiMediaTypeLabel,
  hitoyasumiTemplateLabel,
} from "@/lib/journal/moriLog/hitoyasumiMedia";
import type { MoriLogAlbum } from "@/lib/journal/moriLog/moriLogAlbum";
import { getMoriLogMediaBlob } from "@/lib/journal/moriLog/moriLogMediaBlobStore";
import {
  isMoriLogCardMovieType,
  type MoriLogMedia,
} from "@/lib/journal/moriLog/moriLogMedia";
import {
  LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_EMPTY,
  LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_LOOP_OFF,
  LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_LOOP_ON,
  LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_NEXT,
  LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_PAUSE,
  LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_PLAY,
  LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_PREV,
  LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_START,
  LOG_HOUSE_HITOYASUMI_CLOSE_DETAIL,
  LOG_HOUSE_HITOYASUMI_NO_PREVIEW,
} from "@/lib/loghouse/logHouseHitoyasumiCopy";

/** 静止画の連続再生での表示秒数 */
export const HITOYASUMI_ALBUM_STILL_DWELL_MS = 4000;

type SlideBlob = {
  objectUrl: string | null;
  blob: Blob | null;
  mimeType: string | null;
};

type Props = {
  album: MoriLogAlbum;
  pages: MoriLogMedia[];
  onClose: () => void;
};

type VideoEl = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
};

async function enterVideoFullscreen(video: VideoEl): Promise<void> {
  try {
    if (typeof video.webkitEnterFullscreen === "function") {
      video.webkitEnterFullscreen();
      return;
    }
    if (typeof video.requestFullscreen === "function") {
      await video.requestFullscreen();
    }
  } catch {
    // 拒否されてもアプリ内全画面で継続
  }
}

async function exitDomFullscreen(): Promise<void> {
  try {
    if (document.fullscreenElement && document.exitFullscreen) {
      await document.exitFullscreen();
    }
  } catch {
    // ignore
  }
}

export function HitoyasumiAlbumViewer({ album, pages, onClose }: Props) {
  const videoRef = useRef<VideoEl | null>(null);
  /** スライド切替中の pause で playing を落とさない */
  const ignorePauseRef = useRef(false);

  const [index, setIndex] = useState(0);
  const [slide, setSlide] = useState<SlideBlob>({
    objectUrl: null,
    blob: null,
    mimeType: null,
  });
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(true);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [needsGesture, setNeedsGesture] = useState(true);

  const page = pages[index] ?? null;
  const total = pages.length;

  const isVideoSlide =
    !!page &&
    isMoriLogCardMovieType(page.type) &&
    (slide.mimeType ?? "").startsWith("video/");

  const goNext = useCallback(() => {
    setIndex((prev) => {
      if (total <= 0) return 0;
      if (prev >= total - 1) return loop ? 0 : prev;
      return prev + 1;
    });
  }, [loop, total]);

  const goPrev = useCallback(() => {
    setIndex((prev) => {
      if (total <= 0) return 0;
      if (prev <= 0) return loop ? Math.max(0, total - 1) : 0;
      return prev - 1;
    });
  }, [loop, total]);

  const closeViewer = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      try {
        ignorePauseRef.current = true;
        video.pause();
      } catch {
        // ignore
      }
    }
    void exitDomFullscreen();
    onClose();
  }, [onClose]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeViewer();
        return;
      }
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === " ") {
        event.preventDefault();
        setPlaying((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeViewer, goNext, goPrev]);

  useEffect(() => {
    let cancelled = false;
    let createdUrl: string | null = null;

    async function load() {
      if (!page) {
        setSlide({ objectUrl: null, blob: null, mimeType: null });
        return;
      }
      const blob = await getMoriLogMediaBlob(page.id);
      if (cancelled) return;
      const objectUrl = blob ? URL.createObjectURL(blob) : null;
      createdUrl = objectUrl;
      setSlide({
        objectUrl,
        blob: blob ?? null,
        mimeType: blob?.type ?? null,
      });
    }

    void load();
    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [page]);

  /** タップ直下で再生＋全画面（iOS のジェスチャ要件） */
  const playVideoFromGesture = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return false;
    try {
      ignorePauseRef.current = false;
      video.playsInline = true;
      await video.play();
      await enterVideoFullscreen(video);
      return true;
    } catch {
      return false;
    }
  }, []);

  const startPlayback = useCallback(async () => {
    setChromeVisible(true);
    if (isVideoSlide) {
      const ok = await playVideoFromGesture();
      if (!ok) {
        setNeedsGesture(true);
        setPlaying(false);
        return;
      }
    }
    setNeedsGesture(false);
    setPlaying(true);
  }, [isVideoSlide, playVideoFromGesture]);

  const togglePlayPause = useCallback(async () => {
    setChromeVisible(true);
    if (needsGesture) {
      await startPlayback();
      return;
    }

    const video = videoRef.current;
    if (playing) {
      ignorePauseRef.current = true;
      if (video && isVideoSlide) video.pause();
      setPlaying(false);
      window.setTimeout(() => {
        ignorePauseRef.current = false;
      }, 0);
      return;
    }

    if (isVideoSlide) {
      const ok = await playVideoFromGesture();
      if (!ok) {
        setNeedsGesture(true);
        setPlaying(false);
        return;
      }
    }
    setPlaying(true);
  }, [isVideoSlide, needsGesture, playVideoFromGesture, playing, startPlayback]);

  // スライドが進んだあと、再生中なら次の動画も続けて再生を試みる
  useEffect(() => {
    if (!playing || !isVideoSlide || !slide.objectUrl) return;
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    ignorePauseRef.current = true;
    void (async () => {
      try {
        await video.play();
        if (cancelled) return;
        setNeedsGesture(false);
        await enterVideoFullscreen(video);
      } catch {
        if (!cancelled) {
          setPlaying(false);
          setNeedsGesture(true);
        }
      } finally {
        ignorePauseRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [index, isVideoSlide, playing, slide.objectUrl]);

  // 静止画タイマー
  useEffect(() => {
    if (!playing || !page || isVideoSlide || total <= 0) return;
    if (!loop && index >= total - 1) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => {
      goNext();
    }, HITOYASUMI_ALBUM_STILL_DWELL_MS);
    return () => window.clearTimeout(timer);
  }, [goNext, index, isVideoSlide, loop, page, playing, total]);

  useEffect(() => {
    if (!playing || !chromeVisible || needsGesture) return;
    const timer = window.setTimeout(() => setChromeVisible(false), 2800);
    return () => window.clearTimeout(timer);
  }, [chromeVisible, index, needsGesture, playing]);

  const onVideoEnded = useCallback(() => {
    if (!playing) return;
    if (!loop && index >= total - 1) {
      setPlaying(false);
      setChromeVisible(true);
      return;
    }
    goNext();
  }, [goNext, index, loop, playing, total]);

  if (total === 0) {
    return (
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center bg-[#120c08]/90 p-4"
        role="dialog"
        aria-modal="true"
        aria-label={album.title}
      >
        <div className="w-full max-w-sm rounded-2xl border border-[#e4d5c0] bg-[#fffaf2] px-5 py-5">
          <h2 className="text-base font-semibold text-[#3f3428]">{album.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#5c4a35]">
            {LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_EMPTY}
          </p>
          <button
            type="button"
            onClick={closeViewer}
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[#d9cbb8] bg-[#f7f0e4] px-4 text-sm font-medium text-[#5c4a3a]"
          >
            {LOG_HOUSE_HITOYASUMI_CLOSE_DETAIL}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={album.title}
      onClick={() => setChromeVisible(true)}
    >
      <div className="relative min-h-0 flex-1">
        {slide.objectUrl ? (
          isVideoSlide ? (
            <video
              key={page?.id ?? index}
              ref={videoRef}
              src={slide.objectUrl}
              className="absolute inset-0 h-full w-full bg-black object-contain"
              playsInline
              controls={false}
              onEnded={onVideoEnded}
              onPause={() => {
                if (ignorePauseRef.current) return;
                setPlaying(false);
              }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={slide.objectUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-contain"
            />
          )
        ) : (
          <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-[#d9cbb8]">
            {LOG_HOUSE_HITOYASUMI_NO_PREVIEW}
          </p>
        )}

        {needsGesture || (!playing && isVideoSlide) ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void startPlayback();
            }}
            onMouseDown={(e) => e.preventDefault()}
            className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-3 bg-black/25 px-6"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/80 bg-white/95 text-[#1a120c] shadow-lg">
              <svg aria-hidden className="ml-1 h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5.5v13l11-6.5L8 5.5z" />
              </svg>
            </span>
            <span className="rounded-full bg-black/55 px-4 py-2 text-sm font-medium text-white">
              {LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_START}
            </span>
          </button>
        ) : null}

        <div
          className={[
            "pointer-events-none absolute inset-x-0 top-0 z-[3] bg-gradient-to-b from-black/70 to-transparent px-3 pb-10 pt-[max(0.75rem,env(safe-area-inset-top))] transition-opacity duration-300",
            chromeVisible || needsGesture || !playing ? "opacity-100" : "opacity-0",
          ].join(" ")}
        >
          <div className="pointer-events-auto flex items-start justify-between gap-3">
            <div className="min-w-0 text-white">
              <p className="truncate text-xs text-white/75">{album.title}</p>
              {page ? (
                <>
                  <p className="mt-1 inline-flex rounded-md border border-white/25 bg-white/15 px-2 py-0.5 text-[11px] font-medium">
                    {hitoyasumiMediaTypeLabel(page.type)}
                  </p>
                  <h2 className="mt-1.5 truncate text-base font-semibold">
                    {page.title?.trim() || hitoyasumiTemplateLabel(page.templateId)}
                  </h2>
                  <p className="mt-0.5 text-[11px] text-white/70">
                    {index + 1} / {total}
                    {" · "}
                    {formatHitoyasumiCreatedAt(page.createdAt)}
                  </p>
                </>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeViewer();
                }}
                className="min-h-[40px] rounded-lg border border-white/30 bg-black/45 px-3 text-sm text-white"
              >
                {LOG_HOUSE_HITOYASUMI_CLOSE_DETAIL}
              </button>
              <button
                type="button"
                aria-pressed={loop}
                onClick={(e) => {
                  e.stopPropagation();
                  setChromeVisible(true);
                  setLoop((v) => !v);
                }}
                className={[
                  "min-h-[36px] rounded-full border px-3 text-[11px] font-medium",
                  loop
                    ? "border-emerald-300/70 bg-emerald-800/90 text-white"
                    : "border-white/30 bg-black/45 text-white/90",
                ].join(" ")}
              >
                {loop
                  ? LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_LOOP_ON
                  : LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_LOOP_OFF}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className={[
          "z-[3] border-t border-white/10 bg-black/80 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-opacity duration-300",
          chromeVisible || needsGesture || !playing ? "opacity-100" : "opacity-0",
          chromeVisible || needsGesture || !playing
            ? "pointer-events-auto"
            : "pointer-events-none",
        ].join(" ")}
      >
        <div className="mx-auto flex w-full max-w-lg items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setChromeVisible(true);
              goPrev();
            }}
            disabled={!loop && index <= 0}
            className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-white/25 bg-white/10 px-3 text-sm font-medium text-white disabled:opacity-35"
          >
            {LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_PREV}
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              void togglePlayPause();
            }}
            className="inline-flex min-h-[48px] flex-[1.2] items-center justify-center rounded-xl border border-emerald-300/50 bg-emerald-800 px-3 text-sm font-semibold text-white"
          >
            {playing
              ? LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_PAUSE
              : LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_PLAY}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setChromeVisible(true);
              goNext();
            }}
            disabled={!loop && index >= total - 1}
            className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-white/25 bg-white/10 px-3 text-sm font-medium text-white disabled:opacity-35"
          >
            {LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_NEXT}
          </button>
        </div>
      </div>
    </div>
  );
}
