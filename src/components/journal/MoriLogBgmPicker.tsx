"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  MORI_LOG_BGM_TRACKS,
  type MoriLogBgmTrack,
} from "@/lib/journal/moriLog/moriLogBgmCatalog";

type Props = {
  value: string | null;
  onChange: (bgmId: string) => void;
};

/** 森ログムービー用：BGM一覧・試聴・選択（MP4書き出しは別ステップ） */
export function MoriLogBgmPicker({ value, onChange }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [errorById, setErrorById] = useState<Record<string, string>>({});

  const stopPreview = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setPreviewId(null);
  }, []);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
      }
    };
  }, []);

  const playTrack = useCallback(
    async (track: MoriLogBgmTrack) => {
      if (previewId === track.id) {
        stopPreview();
        return;
      }

      stopPreview();

      const audio = audioRef.current ?? new Audio();
      audioRef.current = audio;
      audio.preload = "metadata";
      audio.src = track.src;

      try {
        if (audio.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
          await new Promise<void>((resolve, reject) => {
            const onReady = () => {
              cleanup();
              resolve();
            };
            const onError = () => {
              cleanup();
              reject(new Error("audio-load-failed"));
            };
            const cleanup = () => {
              audio.removeEventListener("canplay", onReady);
              audio.removeEventListener("error", onError);
              window.clearTimeout(timeoutId);
            };
            const timeoutId = window.setTimeout(() => {
              cleanup();
              reject(new Error("audio-load-timeout"));
            }, 15000);
            audio.addEventListener("canplay", onReady, { once: true });
            audio.addEventListener("error", onError, { once: true });
            audio.load();
          });
        }

        await audio.play();
        setPreviewId(track.id);
        setErrorById((prev) => {
          if (!prev[track.id]) return prev;
          const next = { ...prev };
          delete next[track.id];
          return next;
        });
        audio.onended = () => setPreviewId(null);
      } catch (err) {
        setPreviewId(null);
        const message =
          err instanceof Error && err.name === "NotAllowedError"
            ? "ブラウザが再生をブロックしました。もう一度ボタンを押してください。"
            : "音源を読み込めませんでした。もう一度お試しください。";
        setErrorById((prev) => ({ ...prev, [track.id]: message }));
      }
    },
    [previewId, stopPreview],
  );

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-[#3f3428]">ムービーのBGM</p>
        <p className="mt-1 text-xs leading-relaxed text-[#6b5a48]">
          森の小さな音楽堂の曲から選べます。▶ で試聴できます（この段階では動画の書き出しはありません）。
        </p>
      </div>

      <ul className="space-y-2">
        {MORI_LOG_BGM_TRACKS.map((track) => {
          const selected = value === track.id;
          const playing = previewId === track.id;
          const errorMessage = errorById[track.id];
          return (
            <li key={track.id}>
              <div
                className={[
                  "rounded-xl border px-3 py-3 transition",
                  selected
                    ? "border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-200"
                    : "border-[#e0d2bc]/95 bg-white",
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => onChange(track.id)}
                    aria-pressed={selected}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block text-sm font-semibold text-[#3f3428]">{track.title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-[#6b5a48]">
                      {track.description}
                    </span>
                    {selected ? (
                      <span className="mt-1.5 inline-block text-[11px] font-medium text-emerald-800">
                        選択中
                      </span>
                    ) : null}
                    {errorMessage ? (
                      <span className="mt-1.5 block text-xs text-amber-800">{errorMessage}</span>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    onClick={() => void playTrack(track)}
                    aria-pressed={playing}
                    aria-label={playing ? `${track.title}を停止` : `${track.title}を試聴`}
                    className={[
                      "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm transition",
                      playing
                        ? "border-emerald-400 bg-emerald-700 text-white"
                        : "border-stone-200 bg-stone-50 text-stone-700 hover:border-emerald-200 hover:bg-emerald-50",
                    ].join(" ")}
                  >
                    {playing ? "■" : "▶"}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {previewId ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={stopPreview}
            className="min-h-[40px] rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
          >
            試聴を停止
          </button>
        </div>
      ) : null}
    </div>
  );
}
