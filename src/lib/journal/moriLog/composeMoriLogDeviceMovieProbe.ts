/**
 * 端末動画のメタデータ取得（mediabunny Input）。
 */

import { ALL_FORMATS, BlobSource, Input } from "mediabunny";

import {
  MoriLogDeviceMovieError,
  type MoriLogDeviceMovieSourceProbe,
} from "@/lib/journal/moriLog/composeMoriLogDeviceMovieTypes";

export async function probeMoriLogDeviceMovieSource(
  source: Blob,
): Promise<{ probe: MoriLogDeviceMovieSourceProbe; input: Input }> {
  let input: Input;
  try {
    input = new Input({
      source: new BlobSource(source),
      formats: ALL_FORMATS,
    });
  } catch (cause) {
    throw new MoriLogDeviceMovieError(
      "SOURCE_UNSUPPORTED",
      "この動画形式には対応していません。",
      cause,
    );
  }

  try {
    const canRead = await input.canRead();
    if (!canRead) {
      input.dispose();
      throw new MoriLogDeviceMovieError(
        "SOURCE_UNSUPPORTED",
        "この動画形式には対応していません。",
      );
    }

    const videoTrack = await input.getPrimaryVideoTrack();
    if (!videoTrack) {
      input.dispose();
      throw new MoriLogDeviceMovieError(
        "SOURCE_UNSUPPORTED",
        "映像トラックが見つかりませんでした。",
      );
    }

    const [durationSec, width, height, rotationDeg, canDecodeVideo, audioTrack] =
      await Promise.all([
        input.computeDuration(),
        videoTrack.getDisplayWidth(),
        videoTrack.getDisplayHeight(),
        videoTrack.getRotation(),
        videoTrack.canDecode(),
        input.getPrimaryAudioTrack(),
      ]);

    let canDecodeAudio = false;
    if (audioTrack) {
      try {
        canDecodeAudio = await audioTrack.canDecode();
      } catch {
        canDecodeAudio = false;
      }
    }

    const mimeType =
      typeof (source as File).type === "string" && (source as File).type
        ? (source as File).type
        : (await input.getMimeType().catch(() => undefined)) || undefined;

    return {
      input,
      probe: {
        durationSec,
        width,
        height,
        rotationDeg: typeof rotationDeg === "number" ? rotationDeg : 0,
        hasAudio: Boolean(audioTrack),
        canDecodeVideo,
        canDecodeAudio,
        mimeType,
      },
    };
  } catch (error) {
    try {
      input.dispose();
    } catch {
      // ignore
    }
    if (error instanceof MoriLogDeviceMovieError) throw error;
    throw new MoriLogDeviceMovieError(
      "METADATA_LOAD_FAILED",
      "動画の情報を読み取れませんでした。",
      error,
    );
  }
}
