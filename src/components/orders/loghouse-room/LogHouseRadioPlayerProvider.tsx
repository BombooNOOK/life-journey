/**
 * 森のラジカセ — アプリ内遷移でも再生を継続するための共有プレイヤー。
 * （ログハウス画面を離れて机・おでかけ等へ移動しても、<audio> がアンマウントされない）
 */

"use client";

import { createContext, useContext, type ReactNode } from "react";

import {
  useLogHouseRadioPlayerController,
  type LogHouseRadioPlayer,
} from "@/hooks/useLogHouseRadioPlayer";
import { findLogHouseRadioCassette } from "@/lib/loghouse/logHouseRadioCassette";

const LogHouseRadioPlayerContext = createContext<LogHouseRadioPlayer | null>(null);

export function LogHouseRadioPlayerProvider({ children }: { children: ReactNode }) {
  const player = useLogHouseRadioPlayerController();
  const cassette = findLogHouseRadioCassette(player.cassetteId);

  return (
    <LogHouseRadioPlayerContext.Provider value={player}>
      {children}
      <audio
        ref={player.audioRef}
        src={cassette.audioSrc || undefined}
        preload="metadata"
        onEnded={player.onAudioEnded}
        onPause={player.onAudioPause}
        onPlay={player.onAudioPlay}
        onError={player.onAudioError}
        className="pointer-events-none absolute h-px w-px opacity-0"
        aria-hidden
      />
    </LogHouseRadioPlayerContext.Provider>
  );
}

/** 共有ラジカセ。Provider 配下で使う（部屋モーダル・再生オーラなど） */
export function useLogHouseRadioPlayer(): LogHouseRadioPlayer {
  const player = useContext(LogHouseRadioPlayerContext);
  if (!player) {
    throw new Error("useLogHouseRadioPlayer must be used within LogHouseRadioPlayerProvider");
  }
  return player;
}
