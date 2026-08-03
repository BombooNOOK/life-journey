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

type Props = {
  album: MoriLogAlbum;
  pages: MoriLogMedia[];
  onClose: () => void;
};

function isVideoPage(page: MoriLogMedia | null | undefined, mimeType: string | null): boolean {
  if (!page || !isMoriLogCardMovieType(page.type)) return false;
  if (!mimeType) return true;
  return mimeType.startsWith("video/");
}

function videoHasSrc(video: HTMLVideoElement, url: string): boolean {
  const attr = video.getAttribute("src");
  if (attr === url) return true;
  // currentSrc は絶対化されることがある
  return video.currentSrc === url || video.src === url;
}

/**
 * 連続再生／ループ向けビューワー。
 * iOS では ended の直後に pause が先に来て playing が落ち、次へ進まないことがある。
 * playlistActive で意図を守り、同じ video の src 差し替えで次を再生する。
 */
export function HitoyasumiAlbumViewer({ album, pages, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  /** ユーザーが開始したプレイリスト再生中か（一時停止／閉じるで false） */
  const playlistActiveRef = useRef(false);
  const loopRef = useRef(true);
  const indexRef = useRef(0);
  const pagesRef = useRef(pages);
  const urlByIdRef = useRef<Map<string, string>>(new Map());
  const mimeByIdRef = useRef<Map<string, string>>(new Map());
  const ignorePauseRef = useRef(false);
  const stillTimerRef = useRef<number | null>(null);
  const advanceLockRef = useRef(false);

  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(true);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [needsGesture, setNeedsGesture] = useState(true);
  const [currentMime, setCurrentMime] = useState<string | null>(null);

  const total = pages.length;
  const page = pages[index] ?? null;
  const isVideoSlide = isVideoPage(page, currentMime);

  pagesRef.current = pages;
  loopRef.current = loop;
  indexRef.current = index;

  const clearStillTimer = useCallback(() => {
    if (stillTimerRef.current != null) {
      window.clearTimeout(stillTimerRef.current);
      stillTimerRef.current = null;
    }
  }, []);

  const markPlaylistStopped = useCallback(() => {
    playlistActiveRef.current = false;
    setPlaying(false);
    setChromeVisible(true);
  }, []);

  const markPlaylistPlaying = useCallback(() => {
    playlistActiveRef.current = true;
    setPlaying(true);
    setNeedsGesture(false);
  }, []);

  // 先読み（pages の中身の id 列が変わったときだけ）
  const pagesKey = pages.map((p) => p.id).join("|");
  useEffect(() => {
    let cancelled = false;
    const created: string[] = [];
    const list = pagesRef.current;

    async function preload() {
      const urlMap = new Map<string, string>();
      const mimeMap = new Map<string, string>();
      for (const item of list) {
        const blob = await getMoriLogMediaBlob(item.id);
        if (cancelled) return;
        if (!blob || blob.size === 0) continue;
        const url = URL.createObjectURL(blob);
        created.push(url);
        urlMap.set(item.id, url);
        mimeMap.set(item.id, blob.type || "");
      }
      if (cancelled) return;
      urlByIdRef.current = urlMap;
      mimeByIdRef.current = mimeMap;
      const first = list[0];
      setCurrentMime(first ? mimeMap.get(first.id) ?? null : null);
      setReady(true);
    }

    setReady(false);
    void preload();
    return () => {
      cancelled = true;
      clearStillTimer();
      for (const url of created) URL.revokeObjectURL(url);
      urlByIdRef.current = new Map();
      mimeByIdRef.current = new Map();
    };
    // pagesKey で内容変化のみ検知（親の配列参照ゆれで revoke しない）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearStillTimer, pagesKey]);

  const scheduleStillAdvance = useCallback(() => {
    clearStillTimer();
    if (!playlistActiveRef.current) return;
    stillTimerRef.current = window.setTimeout(() => {
      void advanceToRef.current(indexRef.current + 1, { fromEnded: true });
    }, HITOYASUMI_ALBUM_STILL_DWELL_MS);
  }, [clearStillTimer]);

  const advanceToRef = useRef<(
    rawIndex: number,
    opts?: { fromEnded?: boolean; userGesture?: boolean },
  ) => Promise<void>>(async () => {});

  const advanceTo = useCallback(
    async (
      rawIndex: number,
      opts?: { fromEnded?: boolean; userGesture?: boolean },
    ) => {
      const list = pagesRef.current;
      if (list.length === 0) return;
      if (advanceLockRef.current) return;
      advanceLockRef.current = true;

      try {
        let next = rawIndex;
        if (next >= list.length) {
          if (!loopRef.current) {
            markPlaylistStopped();
            setNeedsGesture(true);
            return;
          }
          next = 0;
        }
        if (next < 0) {
          next = loopRef.current ? list.length - 1 : 0;
        }

        // 1件だけのループ：同じインデックスへ戻す
        const nextPage = list[next];
        if (!nextPage) return;

        const url = urlByIdRef.current.get(nextPage.id) ?? null;
        const mime = mimeByIdRef.current.get(nextPage.id) ?? null;
        const nextIsVideo = isVideoPage(nextPage, mime);
        const shouldPlay =
          playlistActiveRef.current || Boolean(opts?.fromEnded) || Boolean(opts?.userGesture);

        clearStillTimer();
        ignorePauseRef.current = true;

        indexRef.current = next;
        setIndex(next);
        setCurrentMime(mime);

        const video = videoRef.current;

        if (nextIsVideo && url && video) {
          try {
            const sameSrc = videoHasSrc(video, url);
            if (sameSrc) {
              // 同一動画のループ／再再生
              try {
                video.currentTime = 0;
              } catch {
                // ignore
              }
            } else {
              video.src = url;
            }
            video.playsInline = true;
            if (shouldPlay) {
              markPlaylistPlaying();
              // ended ハンドラから同期的に play() を開始するのが iOS 連続再生の要点
              const playPromise = video.play();
              await playPromise;
            }
          } catch {
            // 自動再生が弾かれてもインデックスは進んでいる。続きタップを促す
            markPlaylistStopped();
            setNeedsGesture(true);
          }
        } else {
          if (video) {
            try {
              video.pause();
              video.removeAttribute("src");
              video.load();
            } catch {
              // ignore
            }
          }
          if (shouldPlay) {
            markPlaylistPlaying();
            scheduleStillAdvance();
          }
        }
      } finally {
        // src 差し替え起因の pause を十分無視する
        window.setTimeout(() => {
          ignorePauseRef.current = false;
          advanceLockRef.current = false;
        }, 250);
      }
    },
    [clearStillTimer, markPlaylistPlaying, markPlaylistStopped, scheduleStillAdvance],
  );

  advanceToRef.current = advanceTo;

  // 初回：先頭の src だけセット
  useEffect(() => {
    if (!ready) return;
    const first = pagesRef.current[0];
    if (!first) return;
    const url = urlByIdRef.current.get(first.id);
    const mime = mimeByIdRef.current.get(first.id) ?? null;
    setCurrentMime(mime);
    const video = videoRef.current;
    if (video && url && isVideoPage(first, mime)) {
      video.src = url;
    }
  }, [ready]);

  // native ended（React 合成より確実）。pause→ended の競合もここで吸収
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !ready) return;

    const onEnded = () => {
      if (!playlistActiveRef.current) return;
      void advanceToRef.current(indexRef.current + 1, { fromEnded: true });
    };

    const onPause = () => {
      if (ignorePauseRef.current) return;
      // 終了直前の pause は ended に任せる（ここで playlist を止めるとループ不能）
      if (video.ended) return;
      clearStillTimer();
      markPlaylistStopped();
    };

    video.addEventListener("ended", onEnded);
    video.addEventListener("pause", onPause);
    return () => {
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("pause", onPause);
    };
  }, [clearStillTimer, markPlaylistStopped, ready]);

  const startPlayback = useCallback(async () => {
    setChromeVisible(true);
    playlistActiveRef.current = true;
    setNeedsGesture(false);
    setPlaying(true);
    await advanceTo(indexRef.current, { userGesture: true });
  }, [advanceTo]);

  const togglePlayPause = useCallback(async () => {
    setChromeVisible(true);
    if (!playlistActiveRef.current) {
      await startPlayback();
      return;
    }
    const video = videoRef.current;
    ignorePauseRef.current = true;
    clearStillTimer();
    if (video) {
      try {
        video.pause();
      } catch {
        // ignore
      }
    }
    markPlaylistStopped();
    window.setTimeout(() => {
      ignorePauseRef.current = false;
    }, 100);
  }, [clearStillTimer, markPlaylistStopped, startPlayback]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === "ArrowRight") {
        void advanceTo(indexRef.current + 1, { userGesture: true });
      }
      if (event.key === "ArrowLeft") {
        void advanceTo(indexRef.current - 1, { userGesture: true });
      }
      if (event.key === " ") {
        event.preventDefault();
        void togglePlayPause();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [advanceTo, onClose, togglePlayPause]);

  useEffect(() => {
    if (!playing || !chromeVisible || needsGesture) return;
    const timer = window.setTimeout(() => setChromeVisible(false), 2800);
    return () => window.clearTimeout(timer);
  }, [chromeVisible, index, needsGesture, playing]);

  const closeViewer = useCallback(() => {
    clearStillTimer();
    markPlaylistStopped();
    const video = videoRef.current;
    if (video) {
      try {
        ignorePauseRef.current = true;
        video.pause();
      } catch {
        // ignore
      }
    }
    onClose();
  }, [clearStillTimer, markPlaylistStopped, onClose]);

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

  const currentUrl = page ? urlByIdRef.current.get(page.id) ?? null : null;

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={album.title}
      onClick={() => setChromeVisible(true)}
    >
      <div className="relative min-h-0 flex-1">
        <video
          ref={videoRef}
          className={[
            "absolute inset-0 h-full w-full bg-black object-contain",
            isVideoSlide ? "opacity-100" : "pointer-events-none opacity-0",
          ].join(" ")}
          playsInline
          controls={false}
          // ended/pause は addEventListener 側（競合対策）
        />

        {!isVideoSlide && currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-contain"
          />
        ) : null}

        {ready && !currentUrl ? (
          <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-[#d9cbb8]">
            {LOG_HOUSE_HITOYASUMI_NO_PREVIEW}
          </p>
        ) : null}

        {!ready ? (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-[#d9cbb8]">
            読み込んでいます…
          </p>
        ) : null}

        {ready && (needsGesture || !playing) ? (
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
              void advanceTo(indexRef.current - 1, {
                userGesture: true,
                fromEnded: playlistActiveRef.current,
              });
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
              void advanceTo(indexRef.current + 1, {
                userGesture: true,
                fromEnded: playlistActiveRef.current,
              });
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
