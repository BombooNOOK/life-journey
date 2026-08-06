/**
 * 端末動画エンコードの事前検証・切り出し範囲計算（ブラウザ非依存）。
 */

import {
  MORI_LOG_DEVICE_MOVIE_MAX_CLIP_SEC,
  MORI_LOG_DEVICE_MOVIE_MAX_SOURCE_BYTES,
  MORI_LOG_DEVICE_MOVIE_MAX_SOURCE_DURATION_SEC,
  MORI_LOG_DEVICE_MOVIE_MIN_CLIP_SEC,
  MORI_LOG_DEVICE_MOVIE_MIN_SOURCE_DURATION_SEC,
  MoriLogDeviceMovieError,
  type ResolvedDeviceMovieTrim,
} from "@/lib/journal/moriLog/composeMoriLogDeviceMovieTypes";

export function assertDeviceMovieSourceSize(byteLength: number): void {
  if (!Number.isFinite(byteLength) || byteLength <= 0) {
    throw new MoriLogDeviceMovieError(
      "SOURCE_UNSUPPORTED",
      "動画ファイルを読み取れませんでした。",
    );
  }
  if (byteLength > MORI_LOG_DEVICE_MOVIE_MAX_SOURCE_BYTES) {
    throw new MoriLogDeviceMovieError(
      "SOURCE_TOO_LARGE",
      `動画ファイルが大きすぎます（上限 ${Math.floor(MORI_LOG_DEVICE_MOVIE_MAX_SOURCE_BYTES / (1024 * 1024))}MB）。`,
    );
  }
}

export function assertDeviceMovieSourceDuration(durationSec: number): void {
  if (!Number.isFinite(durationSec) || durationSec <= 0) {
    throw new MoriLogDeviceMovieError(
      "METADATA_LOAD_FAILED",
      "動画の長さを取得できませんでした。",
    );
  }
  if (durationSec < MORI_LOG_DEVICE_MOVIE_MIN_SOURCE_DURATION_SEC) {
    throw new MoriLogDeviceMovieError(
      "SOURCE_TOO_SHORT",
      `動画が短すぎます（${MORI_LOG_DEVICE_MOVIE_MIN_SOURCE_DURATION_SEC}秒以上必要です）。`,
    );
  }
  if (durationSec > MORI_LOG_DEVICE_MOVIE_MAX_SOURCE_DURATION_SEC) {
    throw new MoriLogDeviceMovieError(
      "SOURCE_TOO_LONG",
      `動画が長すぎます（上限 ${MORI_LOG_DEVICE_MOVIE_MAX_SOURCE_DURATION_SEC}秒）。`,
    );
  }
}

/**
 * 開始位置・使用秒数を元尺に合わせて補正する。
 * - クリップは 3〜10 秒（元がそれより短い場合は元の全体）
 * - 終端超過は終端までに切り詰め
 * - 結果が 3 秒未満なら開始を前へずらして可能な限り 3 秒を確保
 */
export function resolveDeviceMovieTrim(options: {
  sourceDurationSec: number;
  startSec: number;
  durationSec: number;
}): ResolvedDeviceMovieTrim {
  const sourceDurationSec = options.sourceDurationSec;
  assertDeviceMovieSourceDuration(sourceDurationSec);

  if (!Number.isFinite(options.startSec) || !Number.isFinite(options.durationSec)) {
    throw new MoriLogDeviceMovieError(
      "INVALID_TRIM_RANGE",
      "切り出し範囲が不正です。",
    );
  }

  const maxClip = Math.min(MORI_LOG_DEVICE_MOVIE_MAX_CLIP_SEC, sourceDurationSec);
  const minClip = Math.min(MORI_LOG_DEVICE_MOVIE_MIN_CLIP_SEC, maxClip);

  let requestedDuration = options.durationSec;
  if (requestedDuration <= 0) {
    requestedDuration = maxClip;
  }
  requestedDuration = Math.min(MORI_LOG_DEVICE_MOVIE_MAX_CLIP_SEC, Math.max(minClip, requestedDuration));
  requestedDuration = Math.min(requestedDuration, sourceDurationSec);

  let startSec = Math.max(0, options.startSec);
  if (startSec >= sourceDurationSec) {
    startSec = Math.max(0, sourceDurationSec - requestedDuration);
  }

  let endSec = Math.min(sourceDurationSec, startSec + requestedDuration);
  let durationSec = endSec - startSec;

  if (durationSec < minClip) {
    endSec = Math.min(sourceDurationSec, startSec + minClip);
    durationSec = endSec - startSec;
    if (durationSec < minClip) {
      endSec = Math.min(sourceDurationSec, minClip);
      startSec = Math.max(0, endSec - minClip);
      durationSec = endSec - startSec;
    }
  }

  if (durationSec < MORI_LOG_DEVICE_MOVIE_MIN_CLIP_SEC - 1e-3 && sourceDurationSec >= MORI_LOG_DEVICE_MOVIE_MIN_CLIP_SEC) {
    // 理論上ここに来ないが、浮動小数の保険
    startSec = 0;
    endSec = Math.min(sourceDurationSec, MORI_LOG_DEVICE_MOVIE_MIN_CLIP_SEC);
    durationSec = endSec - startSec;
  }

  if (durationSec <= 0 || endSec <= startSec) {
    throw new MoriLogDeviceMovieError(
      "INVALID_TRIM_RANGE",
      "切り出し範囲を確保できませんでした。",
    );
  }

  return {
    startSec,
    endSec,
    durationSec,
  };
}

/** 既存静止画ムービーと同じ短辺上限の考え方（偶数。iOS 向けに 16 の倍数も可） */
export function resolveDeviceMovieOutputSize(options: {
  displayWidth: number;
  displayHeight: number;
  maxEdge: number;
  /** iPhone の VideoEncoder は 16 の倍数を要求することがある */
  multipleOf?: number;
}): { width: number; height: number } {
  const w = Math.max(1, options.displayWidth);
  const h = Math.max(1, options.displayHeight);
  const scale = Math.min(1, options.maxEdge / Math.max(w, h));
  const multiple = Math.max(2, options.multipleOf ?? 2);
  const roundTo = (value: number) => {
    const raw = Math.max(multiple, Math.round(value));
    return Math.max(multiple, Math.round(raw / multiple) * multiple);
  };
  return {
    width: roundTo(w * scale),
    height: roundTo(h * scale),
  };
}

export function isLikelyAppleMobileForDeviceMovie(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/i.test(ua)) return true;
  return /Macintosh/i.test(ua) && typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 1;
}
