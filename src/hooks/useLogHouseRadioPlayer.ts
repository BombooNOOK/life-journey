/**
 * 森のラジカセ — 再生コントローラ（状態本体）
 * アプリ内で音を継続するときは LogHouseRadioPlayerProvider 経由で1インスタンスだけ使う。
 */

"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";

import {
  findLogHouseRadioCassette,
  LOG_HOUSE_RADIO_DEFAULT_CASSETTE_ID,
  type LogHouseRadioRepeatMode,
  type LogHouseRadioSleepTimerMinutes,
} from "@/lib/loghouse/logHouseRadioCassette";

function stopAudioElement(audio: HTMLAudioElement | null) {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}

export type LogHouseRadioPlayer = {
  audioRef: RefObject<HTMLAudioElement | null>;
  cassetteId: string;
  isPlaying: boolean;
  isPaused: boolean;
  repeatMode: LogHouseRadioRepeatMode;
  sleepTimer: LogHouseRadioSleepTimerMinutes;
  playbackError: string | null;
  setCassetteId: (id: string) => void;
  setRepeatMode: Dispatch<SetStateAction<LogHouseRadioRepeatMode>>;
  setSleepTimer: Dispatch<SetStateAction<LogHouseRadioSleepTimerMinutes>>;
  handlePlayPause: () => Promise<void>;
  handleStop: () => void;
  onAudioEnded: () => void;
  onAudioPlay: () => void;
  onAudioPause: () => void;
  onAudioError: () => void;
};

/** Provider 専用。画面コンポーネントからは useLogHouseRadioPlayer（Provider）を使う */
export function useLogHouseRadioPlayerController(): LogHouseRadioPlayer {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [cassetteId, setCassetteIdState] = useState(LOG_HOUSE_RADIO_DEFAULT_CASSETTE_ID);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [repeatMode, setRepeatMode] = useState<LogHouseRadioRepeatMode>("off");
  const [sleepTimer, setSleepTimer] = useState<LogHouseRadioSleepTimerMinutes>("off");
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const cassette = findLogHouseRadioCassette(cassetteId);

  const setCassetteId = useCallback((id: string) => {
    stopAudioElement(audioRef.current);
    setCassetteIdState(id);
    setIsPlaying(false);
    setIsPaused(false);
    setPlaybackError(null);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = repeatMode === "one" || repeatMode === "all";
  }, [repeatMode]);

  useEffect(() => {
    if (!isPlaying || sleepTimer === "off") return;
    const timeoutId = window.setTimeout(() => {
      stopAudioElement(audioRef.current);
      setIsPlaying(false);
      setIsPaused(false);
    }, sleepTimer * 60 * 1000);
    return () => window.clearTimeout(timeoutId);
  }, [isPlaying, sleepTimer, cassetteId]);

  const handlePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    const current = findLogHouseRadioCassette(cassetteId);

    if (!current.audioSrc || !audio) {
      if (isPlaying) {
        setIsPlaying(false);
        setIsPaused(true);
        return;
      }
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    if (!audio.paused) {
      audio.pause();
      setIsPlaying(false);
      setIsPaused(true);
      return;
    }

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
      setPlaybackError(null);
      setIsPlaying(true);
      setIsPaused(false);
    } catch (err) {
      setIsPlaying(false);
      if (err instanceof Error && err.name === "NotAllowedError") {
        setPlaybackError("ブラウザが再生をブロックしました。もう一度再生を押してください。");
      } else {
        setPlaybackError("音源を読み込めませんでした。もう一度お試しください。");
      }
    }
  }, [cassetteId, isPlaying]);

  const handleStop = useCallback(() => {
    stopAudioElement(audioRef.current);
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  return {
    audioRef,
    cassetteId,
    isPlaying,
    isPaused,
    repeatMode,
    sleepTimer,
    playbackError,
    setCassetteId,
    setRepeatMode,
    setSleepTimer,
    handlePlayPause,
    handleStop,
    onAudioEnded: () => {
      if (repeatMode === "one" || repeatMode === "all") return;
      setIsPlaying(false);
      setIsPaused(false);
    },
    onAudioPlay: () => setIsPlaying(true),
    onAudioPause: () => {
      if (audioRef.current?.paused) setIsPlaying(false);
    },
    onAudioError: () => {
      if (!cassette.audioSrc) return;
      setIsPlaying(false);
      setPlaybackError("音源ファイルが見つかりませんでした。");
    },
  };
}
