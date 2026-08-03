"use client";

import { useCallback, useEffect, useState } from "react";

import {
  formatHitoyasumiCreatedAt,
  hitoyasumiMediaTypeLabel,
  hitoyasumiTemplateLabel,
} from "@/lib/journal/moriLog/hitoyasumiMedia";
import type { MoriLogAlbum } from "@/lib/journal/moriLog/moriLogAlbum";
import {
  getMoriLogMediaBlob,
} from "@/lib/journal/moriLog/moriLogMediaBlobStore";
import {
  isMoriLogCardMovieType,
  type MoriLogMedia,
} from "@/lib/journal/moriLog/moriLogMedia";
import {
  LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_EMPTY,
  LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_NEXT,
  LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_PAUSE,
  LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_PLAY,
  LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_PREV,
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

export function HitoyasumiAlbumViewer({ album, pages, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const [slide, setSlide] = useState<SlideBlob>({
    objectUrl: null,
    blob: null,
    mimeType: null,
  });
  const [playing, setPlaying] = useState(true);

  const page = pages[index] ?? null;
  const total = pages.length;

  const goNext = useCallback(() => {
    setIndex((prev) => {
      if (total <= 0) return 0;
      if (prev >= total - 1) return prev;
      return prev + 1;
    });
  }, [total]);

  const goPrev = useCallback(() => {
    setIndex((prev) => Math.max(0, prev - 1));
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev, onClose]);

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

  const isVideoSlide =
    !!page &&
    isMoriLogCardMovieType(page.type) &&
    (slide.mimeType ?? "").startsWith("video/");

  // 静止画は一定秒数で次へ（最終ページでは止まらない・ループしない）
  useEffect(() => {
    if (!playing || !page || isVideoSlide || total <= 0) return;
    if (index >= total - 1) return;
    const timer = window.setTimeout(() => {
      goNext();
    }, HITOYASUMI_ALBUM_STILL_DWELL_MS);
    return () => window.clearTimeout(timer);
  }, [goNext, index, isVideoSlide, page, playing, total]);

  if (total === 0) {
    return (
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center bg-[#120c08]/78 p-4 backdrop-blur-[2px]"
        role="dialog"
        aria-modal="true"
        aria-label={album.title}
      >
        <div className="w-full max-w-sm rounded-2xl border border-[#e4d5c0] bg-[#fffaf2] px-5 py-5 shadow-[0_16px_40px_rgba(40,28,16,0.28)]">
          <h2 className="text-base font-semibold text-[#3f3428]">{album.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#5c4a35]">
            {LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_EMPTY}
          </p>
          <button
            type="button"
            onClick={onClose}
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
      className="fixed inset-0 z-[70] flex items-end justify-center bg-[#120c08]/78 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={album.title}
    >
      <div className="flex max-h-[100dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.35rem] border border-[#e4d5c0]/95 bg-[#fffaf2] shadow-[0_20px_50px_rgba(20,12,8,0.45)] sm:max-h-[94dvh] sm:rounded-[1.35rem]">
        <div className="flex items-start justify-between gap-3 px-3 pt-3 sm:px-4 sm:pt-4">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-[#8a7660]">{album.title}</p>
            {page ? (
              <>
                <p className="mt-1 inline-flex rounded-md border border-[#e0d2bc]/90 bg-[#f7efe3] px-2 py-0.5 text-xs font-medium text-[#5c4a35]">
                  {hitoyasumiMediaTypeLabel(page.type)}
                </p>
                <h2 className="mt-2 truncate text-lg font-semibold text-[#3d3226]">
                  {page.title?.trim() || hitoyasumiTemplateLabel(page.templateId)}
                </h2>
                <p className="mt-1 text-xs text-[#8a7660]">
                  {index + 1} / {total}
                  {" · "}
                  {formatHitoyasumiCreatedAt(page.createdAt)}
                </p>
              </>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] shrink-0 rounded-lg border border-[#e0d2bc]/95 bg-[#f7efe3] px-3 text-sm text-[#5c4a35]"
          >
            {LOG_HOUSE_HITOYASUMI_CLOSE_DETAIL}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-2 py-3 sm:px-4">
          {slide.objectUrl ? (
            isVideoSlide ? (
              <video
                key={page?.id ?? index}
                src={slide.objectUrl}
                className="mx-auto max-h-[62dvh] w-full rounded-xl bg-[#2a221a]"
                controls
                autoPlay={playing}
                playsInline
                onEnded={() => {
                  if (playing) goNext();
                }}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={slide.objectUrl}
                alt=""
                className="mx-auto max-h-[68dvh] w-full rounded-xl object-contain"
              />
            )
          ) : (
            <p className="rounded-xl border border-[#e0d2bc] bg-[#f7efe3] px-4 py-8 text-center text-sm leading-relaxed text-[#6e5c48]">
              {LOG_HOUSE_HITOYASUMI_NO_PREVIEW}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-[#e8dcc8] bg-[#fff7ec]/95 px-3 py-3 sm:px-4">
          <button
            type="button"
            onClick={goPrev}
            disabled={index <= 0}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-[#c4b49a] bg-[#faf3e8] px-3 text-sm font-medium text-[#5c4a35] hover:bg-[#f3ead8] disabled:opacity-40"
          >
            {LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_PREV}
          </button>
          <button
            type="button"
            onClick={() => setPlaying((v) => !v)}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-emerald-800/80 bg-emerald-800 px-3 text-sm font-medium text-white hover:bg-emerald-900"
          >
            {playing
              ? LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_PAUSE
              : LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_PLAY}
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={index >= total - 1}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-[#c4b49a] bg-[#faf3e8] px-3 text-sm font-medium text-[#5c4a35] hover:bg-[#f3ead8] disabled:opacity-40"
          >
            {LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_NEXT}
          </button>
        </div>
      </div>
    </div>
  );
}
