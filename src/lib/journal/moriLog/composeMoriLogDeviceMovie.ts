/**
 * 端末動画 → 森ログムービー用エンコード入口。
 * 保存・どんぐり・椅子 UI には依存しない純粋な変換。
 */

import {
  MoriLogDeviceMovieError,
  type ComposeMoriLogDeviceMovieInput,
  type ComposeMoriLogDeviceMovieResult,
  type MoriLogDeviceMovieSourceProbe,
} from "@/lib/journal/moriLog/composeMoriLogDeviceMovieTypes";
import { probeMoriLogDeviceMovieSource } from "@/lib/journal/moriLog/composeMoriLogDeviceMovieProbe";
import {
  assertDeviceMovieSourceDuration,
  assertDeviceMovieSourceSize,
} from "@/lib/journal/moriLog/composeMoriLogDeviceMovieValidate";

export {
  MORI_LOG_DEVICE_MOVIE_MAX_SOURCE_BYTES,
  MORI_LOG_DEVICE_MOVIE_MAX_SOURCE_DURATION_SEC,
  MORI_LOG_DEVICE_MOVIE_MIN_SOURCE_DURATION_SEC,
  MORI_LOG_DEVICE_MOVIE_MIN_CLIP_SEC,
  MORI_LOG_DEVICE_MOVIE_MAX_CLIP_SEC,
  MoriLogDeviceMovieError,
} from "@/lib/journal/moriLog/composeMoriLogDeviceMovieTypes";
export type {
  ComposeMoriLogDeviceMovieInput,
  ComposeMoriLogDeviceMovieResult,
  MoriLogDeviceMovieAudioMode,
  MoriLogDeviceMovieErrorCode,
  MoriLogDeviceMovieSourceProbe,
  ResolvedDeviceMovieTrim,
} from "@/lib/journal/moriLog/composeMoriLogDeviceMovieTypes";
export {
  assertDeviceMovieSourceDuration,
  assertDeviceMovieSourceSize,
  resolveDeviceMovieTrim,
  resolveDeviceMovieOutputSize,
} from "@/lib/journal/moriLog/composeMoriLogDeviceMovieValidate";
export {
  MORI_LOG_DEVICE_MOVIE_PIPELINE_BUILD,
  resolveDeviceMovieCrop,
} from "@/lib/journal/moriLog/composeMoriLogDeviceMovieWebCodecs";

/**
 * エンコード前にメタデータとサイズ・尺制限だけを確認する。
 * 呼び出し側で入力 Input を閉じる必要はない（内部 dispose）。
 */
export async function inspectMoriLogDeviceMovieSource(
  source: Blob,
): Promise<MoriLogDeviceMovieSourceProbe> {
  assertDeviceMovieSourceSize(source.size);
  const { probe, input } = await probeMoriLogDeviceMovieSource(source);
  try {
    assertDeviceMovieSourceDuration(probe.durationSec);
    return probe;
  } finally {
    input.dispose();
  }
}

/**
 * 端末動画を切り出して再エンコードする。
 * 現状は WebCodecs + mediabunny Conversion のみ（MP4 優先、だめなら WebM）。
 */
export async function composeMoriLogDeviceMovie(
  input: ComposeMoriLogDeviceMovieInput,
): Promise<ComposeMoriLogDeviceMovieResult> {
  try {
    const {
      canComposeMoriLogDeviceMovieWithWebCodecs,
    } = await import("@/lib/journal/moriLog/composeMoriLogDeviceMovieWebCodecs");

    if (!canComposeMoriLogDeviceMovieWithWebCodecs()) {
      throw new MoriLogDeviceMovieError(
        "ENCODER_UNAVAILABLE",
        "この端末では動画エンコードに対応していません。",
      );
    }

    // 4:5「森の映写便り」を毎フレーム合成（通常・iPhone とも Canvas 経路）
    const { composeMoriLogDeviceMovieWithBasicTemplate } = await import(
      "@/lib/journal/moriLog/composeMoriLogDeviceMovieTemplateEncode"
    );
    return await composeMoriLogDeviceMovieWithBasicTemplate(input);
  } catch (error) {
    if (error instanceof MoriLogDeviceMovieError) throw error;
    const detail =
      error instanceof Error && error.message
        ? error.message
        : typeof error === "string"
          ? error
          : "unknown";
    throw new MoriLogDeviceMovieError(
      "ENCODE_FAILED",
      `動画の書き出しに失敗しました。（${detail}）`,
      error,
    );
  }
}
