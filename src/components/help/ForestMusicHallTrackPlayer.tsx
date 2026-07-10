"use client";

import { useCallback, useRef, useState } from "react";

import type { ForestMusicHallTrack } from "@/lib/help/forestMusicHallCatalog";

type Props = {
  track: ForestMusicHallTrack;
};

/** 音楽堂：1曲分の再生コントロール */
export function ForestMusicHallTrackPlayer({ track }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggle = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      setPlaying(false);
      return;
    }

    try {
      // 初回は明示的に読み込んでから再生する
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
      setErrorMessage(null);
      setPlaying(true);
    } catch (err) {
      setPlaying(false);
      if (err instanceof Error && err.name === "NotAllowedError") {
        setErrorMessage("ブラウザが再生をブロックしました。もう一度ボタンを押してください。");
      } else {
        setErrorMessage("音源を読み込めませんでした。ページを再読み込みしてから、もう一度お試しください。");
      }
    }
  }, []);

  return (
    <article className="rounded-xl border border-stone-200 bg-white px-3 py-3 sm:px-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-stone-900">{track.title}</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-stone-500">{track.description}</p>
          {errorMessage ? <p className="mt-2 text-xs text-amber-800">{errorMessage}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => void toggle()}
          aria-pressed={playing}
          aria-label={playing ? `${track.title}を停止` : `${track.title}を再生`}
          className={[
            "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm transition",
            playing
              ? "border-emerald-400 bg-emerald-700 text-white"
              : "border-stone-200 bg-stone-50 text-stone-700 hover:border-emerald-200 hover:bg-emerald-50",
          ].join(" ")}
        >
          {playing ? "■" : "▶"}
        </button>
      </div>
      {/* display:none / sr-only(clip) だと一部環境で再生できないため、視覚だけ隠す */}
      <audio
        ref={audioRef}
        src={track.src}
        preload="metadata"
        onEnded={() => setPlaying(false)}
        onPause={() => {
          if (audioRef.current?.paused) setPlaying(false);
        }}
        onPlay={() => setPlaying(true)}
        onError={() => {
          setPlaying(false);
          setErrorMessage("音源ファイルが見つかりませんでした。");
        }}
        className="pointer-events-none absolute h-px w-px opacity-0"
      />
    </article>
  );
}
