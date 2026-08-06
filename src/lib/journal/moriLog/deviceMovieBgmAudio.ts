/**
 * 端末動画ムービー向け BGM 読み込み・切り出し・フェードアウト（ブラウザ）。
 * 日記由来静止画ムービーの WebCodecs 経路と同系統（AudioBuffer → AAC）。
 */

import { MORI_LOG_DEVICE_MOVIE_MAX_CLIP_SEC } from "@/lib/journal/moriLog/composeMoriLogDeviceMovieTypes";
import { MoriLogDeviceMovieError } from "@/lib/journal/moriLog/composeMoriLogDeviceMovieTypes";
import type { MoriLogBgmTrack } from "@/lib/journal/moriLog/moriLogBgmCatalog";
import {
  DEVICE_MOVIE_PROJECTOR_BGM_TRACKS,
  getDeviceMovieProjectorBgmTrack,
} from "@/lib/journal/moriLog/deviceMovieProjectorBgmCatalog";

/**
 * 最大クリップに足りない音源の閾値（秒）。
 * 一覧は仮音源がすべて 15 秒のため全件表示し、万一短い曲が入ったらエンコード時に BGM_TOO_SHORT。
 * （ループなし・無音パディングなし）
 */
export const DEVICE_MOVIE_BGM_MIN_SOURCE_DURATION_SEC = MORI_LOG_DEVICE_MOVIE_MAX_CLIP_SEC;

export function resolveDeviceMovieBgmFadeOutSec(durationSec: number): number {
  const d = Math.max(0, durationSec);
  return Math.min(0.5, d * 0.15);
}

/** 映写機専用カタログ。ピッカー UI（MoriLogBgmPicker）は共通再利用。 */
export function listDeviceMovieBgmTracks(): readonly MoriLogBgmTrack[] {
  return DEVICE_MOVIE_PROJECTOR_BGM_TRACKS;
}

function getAudioContextCtor(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ||
    null
  );
}

async function fetchArrayBuffer(url: string): Promise<ArrayBuffer> {
  let res: Response;
  try {
    res = await fetch(url, { credentials: "same-origin", cache: "force-cache" });
  } catch (cause) {
    throw new MoriLogDeviceMovieError(
      "BGM_LOAD_FAILED",
      "森の音楽を読み込めませんでした。",
      cause,
    );
  }
  if (!res.ok) {
    throw new MoriLogDeviceMovieError(
      "BGM_LOAD_FAILED",
      "森の音楽を読み込めませんでした。",
    );
  }
  return res.arrayBuffer();
}

export function sliceAudioBuffer(buffer: AudioBuffer, durationSec: number): AudioBuffer {
  const sampleRate = buffer.sampleRate;
  const frameCount = Math.max(1, Math.min(buffer.length, Math.floor(durationSec * sampleRate)));
  const channels = buffer.numberOfChannels;
  const AudioCtx = getAudioContextCtor();
  if (!AudioCtx) return buffer;
  const tmp = new AudioCtx();
  try {
    const sliced = tmp.createBuffer(channels, frameCount, sampleRate);
    for (let ch = 0; ch < channels; ch += 1) {
      sliced.copyToChannel(buffer.getChannelData(ch).subarray(0, frameCount), ch);
    }
    return sliced;
  } finally {
    void tmp.close();
  }
}

/** バッファ末尾へ線形フェードアウトを焼き込む（変更はコピー上） */
export function applyLinearFadeOutToAudioBuffer(
  buffer: AudioBuffer,
  fadeSec: number,
): AudioBuffer {
  const fade = Math.max(0, fadeSec);
  if (fade <= 0) return buffer;
  const sampleRate = buffer.sampleRate;
  const fadeSamples = Math.min(buffer.length, Math.max(1, Math.floor(fade * sampleRate)));
  const AudioCtx = getAudioContextCtor();
  if (!AudioCtx) return buffer;
  const tmp = new AudioCtx();
  try {
    const out = tmp.createBuffer(buffer.numberOfChannels, buffer.length, sampleRate);
    const start = buffer.length - fadeSamples;
    for (let ch = 0; ch < buffer.numberOfChannels; ch += 1) {
      const src = buffer.getChannelData(ch);
      const dst = out.getChannelData(ch);
      dst.set(src);
      for (let i = 0; i < fadeSamples; i += 1) {
        const t = 1 - i / fadeSamples;
        dst[start + i] = src[start + i]! * t;
      }
    }
    return out;
  } finally {
    void tmp.close();
  }
}

export async function loadDeviceMovieBgmAudioBuffer(options: {
  bgmId: string;
  durationSec: number;
  signal?: AbortSignal;
}): Promise<{ track: MoriLogBgmTrack; buffer: AudioBuffer }> {
  const track = getDeviceMovieProjectorBgmTrack(options.bgmId);
  if (!track) {
    throw new MoriLogDeviceMovieError(
      "BGM_NOT_SELECTED",
      "森の音楽をひとつ選んでください。",
    );
  }
  if (options.signal?.aborted) {
    throw new MoriLogDeviceMovieError("CANCELLED", "動画処理をキャンセルしました。");
  }

  const AudioCtx = getAudioContextCtor();
  if (!AudioCtx) {
    throw new MoriLogDeviceMovieError(
      "BGM_DECODE_FAILED",
      "この端末では森の音楽を解読できません。",
    );
  }

  const audioCtx = new AudioCtx();
  try {
    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }
    const raw = await fetchArrayBuffer(track.src);
    if (options.signal?.aborted) {
      throw new MoriLogDeviceMovieError("CANCELLED", "動画処理をキャンセルしました。");
    }
    let decoded: AudioBuffer;
    try {
      decoded = await audioCtx.decodeAudioData(raw.slice(0));
    } catch (cause) {
      throw new MoriLogDeviceMovieError(
        "BGM_DECODE_FAILED",
        "森の音楽を解読できませんでした。",
        cause,
      );
    }

    if (decoded.duration + 1e-3 < options.durationSec) {
      throw new MoriLogDeviceMovieError(
        "BGM_TOO_SHORT",
        "この森の音楽は動画より短いため使えません。別の曲を選んでください。",
      );
    }

    const sliced = sliceAudioBuffer(decoded, options.durationSec);
    const fadeSec = resolveDeviceMovieBgmFadeOutSec(options.durationSec);
    const buffer = applyLinearFadeOutToAudioBuffer(sliced, fadeSec);
    return { track, buffer };
  } finally {
    await audioCtx.close().catch(() => undefined);
  }
}
