/**
 * 端末動画 → 森ログムービー用エンコード基盤の型・定数。
 * 保存・どんぐり・椅子入口には依存しない。
 */

/** original / mute / bgm */
export type MoriLogDeviceMovieAudioMode = "original" | "mute" | "bgm";

export type MoriLogDeviceMovieErrorCode =
  | "SOURCE_TOO_LARGE"
  | "SOURCE_TOO_LONG"
  | "SOURCE_TOO_SHORT"
  | "SOURCE_UNSUPPORTED"
  | "METADATA_LOAD_FAILED"
  | "INVALID_TRIM_RANGE"
  | "VIDEO_DECODE_FAILED"
  | "AUDIO_DECODE_FAILED"
  | "ENCODER_UNAVAILABLE"
  | "ENCODE_FAILED"
  | "POSTER_CREATE_FAILED"
  | "CANCELLED"
  | "BGM_NOT_SELECTED"
  | "BGM_LOAD_FAILED"
  | "BGM_DECODE_FAILED"
  | "BGM_TOO_SHORT"
  | "BGM_ENCODE_FAILED";

export class MoriLogDeviceMovieError extends Error {
  readonly code: MoriLogDeviceMovieErrorCode;
  readonly cause?: unknown;

  constructor(code: MoriLogDeviceMovieErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "MoriLogDeviceMovieError";
    this.code = code;
    this.cause = cause;
  }
}

export type ComposeMoriLogDeviceMovieInput = {
  source: File | Blob;
  startSec: number;
  durationSec: number;
  /** `"original" | "mute" | "bgm"` */
  audioMode: MoriLogDeviceMovieAudioMode;

  /** 将来の位置調整UI向け。今回は初期値（中央・等倍）で足りる。
   * focus は 0..1（画像カバー時の注視点）。
   */
  focusX?: number;
  focusY?: number;
  scale?: number;

  /** プレビュー／完成に焼き込むタイトル（空ならデフォルト題名） */
  title?: string;
  /** 利用者ローカル作成日 YYYY-MM-DD（撮影日・日記日ではない） */
  createdDateKey?: string;
  /** 新規開始時に一度決めた小物。未指定は lantern */
  templateDecorationVariant?: "lantern" | "owl" | "quill";
  /** audioMode === "bgm" のとき必須 */
  bgmId?: string | null;

  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
};

export type ComposeMoriLogDeviceMovieResult = {
  movieBlob: Blob;
  posterBlob: Blob;
  mimeType: string;
  fileExtension: "mp4" | "webm";
  durationSec: number;
  width: number;
  height: number;
  audioMode: MoriLogDeviceMovieAudioMode;
  templateId?: string;
  templateVersion?: number;
  templateDecorationVariant?: "lantern" | "owl" | "quill";
  createdDateKey?: string;
  bgmId?: string | null;
  bgmName?: string | null;
  diagnostics?: {
    encoder: string;
    sourceMimeType?: string;
    sourceWidth?: number;
    sourceHeight?: number;
    sourceDurationSec?: number;
    sourceRotationDeg?: number;
  };
};

export type MoriLogDeviceMovieSourceProbe = {
  durationSec: number;
  width: number;
  height: number;
  rotationDeg: number;
  hasAudio: boolean;
  canDecodeVideo: boolean;
  canDecodeAudio: boolean;
  mimeType?: string;
};

/** 元動画の上限（事前検証） */
export const MORI_LOG_DEVICE_MOVIE_MAX_SOURCE_BYTES = 200 * 1024 * 1024;
export const MORI_LOG_DEVICE_MOVIE_MAX_SOURCE_DURATION_SEC = 60;
export const MORI_LOG_DEVICE_MOVIE_MIN_SOURCE_DURATION_SEC = 3;

/** 切り出し尺 */
export const MORI_LOG_DEVICE_MOVIE_MIN_CLIP_SEC = 3;
export const MORI_LOG_DEVICE_MOVIE_MAX_CLIP_SEC = 10;

export const MORI_LOG_DEVICE_MOVIE_DEFAULT_FOCUS_X = 0.5;
export const MORI_LOG_DEVICE_MOVIE_DEFAULT_FOCUS_Y = 0.5;
export const MORI_LOG_DEVICE_MOVIE_DEFAULT_SCALE = 1;

export type ResolvedDeviceMovieTrim = {
  startSec: number;
  durationSec: number;
  endSec: number;
};
