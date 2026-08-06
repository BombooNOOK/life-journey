/**
 * device_movie_basic を毎フレーム焼き込む Canvas エンコード（通常・iPhone 共通）。
 */

import {
  ALL_FORMATS,
  AudioBufferSink,
  AudioBufferSource,
  BlobSource,
  BufferTarget,
  CanvasSource,
  Input,
  Mp4OutputFormat,
  Output,
  VideoSampleSink,
  getFirstEncodableAudioCodec,
  getFirstEncodableVideoCodec,
  type AudioCodec,
  type VideoCodec,
} from "mediabunny";

import {
  createDeviceMovieBasicLayoutForCanvas,
  loadDeviceMovieBasicAssets,
  paintDeviceMovieBasicFrame,
} from "@/lib/journal/moriLog/deviceMovieBasicPaint";
import {
  DEVICE_MOVIE_BASIC_TEMPLATE_ID,
  DEVICE_MOVIE_BASIC_TEMPLATE_VERSION,
  resolveDeviceMovieBasicCanvasSize,
  resolveDeviceMovieDecorationVariant,
  type DeviceMovieDecorationVariant,
} from "@/lib/journal/moriLog/deviceMovieBasicTemplate";
import {
  MoriLogDeviceMovieError,
  MORI_LOG_DEVICE_MOVIE_DEFAULT_FOCUS_X,
  MORI_LOG_DEVICE_MOVIE_DEFAULT_FOCUS_Y,
  MORI_LOG_DEVICE_MOVIE_DEFAULT_SCALE,
  type ComposeMoriLogDeviceMovieInput,
  type ComposeMoriLogDeviceMovieResult,
} from "@/lib/journal/moriLog/composeMoriLogDeviceMovieTypes";
import {
  assertDeviceMovieSourceDuration,
  assertDeviceMovieSourceSize,
  isLikelyAppleMobileForDeviceMovie,
  resolveDeviceMovieTrim,
} from "@/lib/journal/moriLog/composeMoriLogDeviceMovieValidate";
import { probeMoriLogDeviceMovieSource } from "@/lib/journal/moriLog/composeMoriLogDeviceMovieProbe";
import { DEVICE_MOVIE_DEFAULT_TITLE } from "@/lib/journal/moriLog/deviceMovieComposerCopy";
import { loadDeviceMovieBgmAudioBuffer } from "@/lib/journal/moriLog/deviceMovieBgmAudio";

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new MoriLogDeviceMovieError("CANCELLED", "動画処理をキャンセルしました。");
  }
}

function errorDetail(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

async function canvasToJpegBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b && b.size > 0) resolve(b);
        else reject(new Error("empty poster"));
      },
      "image/jpeg",
      0.92,
    );
  });
}

export async function composeMoriLogDeviceMovieWithBasicTemplate(
  input: ComposeMoriLogDeviceMovieInput,
): Promise<ComposeMoriLogDeviceMovieResult> {
  throwIfAborted(input.signal);
  assertDeviceMovieSourceSize(input.source.size);

  let bgmTrackName: string | null = null;
  let bgmIdOut: string | null = null;
  if (input.audioMode === "bgm") {
    const id = (input.bgmId ?? "").trim();
    if (!id) {
      throw new MoriLogDeviceMovieError(
        "BGM_NOT_SELECTED",
        "森の音楽をひとつ選んでください。",
      );
    }
    bgmIdOut = id;
  }

  const decorationVariant: DeviceMovieDecorationVariant =
    resolveDeviceMovieDecorationVariant(input.templateDecorationVariant);
  const title = (input.title ?? "").trim() || DEVICE_MOVIE_DEFAULT_TITLE;
  const dateKey =
    (input.createdDateKey ?? "").trim() ||
    (() => {
      const n = new Date();
      return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
    })();

  const { probe, input: probeInput } = await probeMoriLogDeviceMovieSource(input.source);
  try {
    assertDeviceMovieSourceDuration(probe.durationSec);
    if (!probe.canDecodeVideo) {
      throw new MoriLogDeviceMovieError(
        "VIDEO_DECODE_FAILED",
        "この端末では映像を解読できません。",
      );
    }
    if (input.audioMode === "original") {
      if (!probe.hasAudio || !probe.canDecodeAudio) {
        throw new MoriLogDeviceMovieError(
          "AUDIO_DECODE_FAILED",
          "この動画の音声形式には対応していません。「音なし」なら作成できる場合があります。",
        );
      }
    }

    const trim = resolveDeviceMovieTrim({
      sourceDurationSec: probe.durationSec,
      startSec: input.startSec,
      durationSec: input.durationSec,
    });

    const appleMobile = isLikelyAppleMobileForDeviceMovie();
    const { width, height } = resolveDeviceMovieBasicCanvasSize({ appleMobile });
    const layout = createDeviceMovieBasicLayoutForCanvas({ width, height });
    const assets = await loadDeviceMovieBasicAssets(decorationVariant);

    try {
      await import("@/lib/journal/diaryPreviewLabelFont");
      if (typeof document !== "undefined" && document.fonts?.load) {
        await document.fonts.load(`600 32px "Klee One"`);
        await document.fonts.load(`500 24px "Klee One"`);
      }
    } catch {
      // フォント欠落時はシステム明朝へフォールバック
    }

    const focusX = input.focusX ?? MORI_LOG_DEVICE_MOVIE_DEFAULT_FOCUS_X;
    const focusY = input.focusY ?? MORI_LOG_DEVICE_MOVIE_DEFAULT_FOCUS_Y;
    const scale = input.scale ?? MORI_LOG_DEVICE_MOVIE_DEFAULT_SCALE;

    const encodeInput = new Input({
      source: new BlobSource(input.source),
      formats: ALL_FORMATS,
    });

    try {
      const videoTrack = await encodeInput.getPrimaryVideoTrack();
      if (!videoTrack || !(await videoTrack.canDecode())) {
        throw new MoriLogDeviceMovieError(
          "VIDEO_DECODE_FAILED",
          "映像を解読できませんでした。",
        );
      }

      const format = new Mp4OutputFormat({ fastStart: "in-memory" });
      const videoCodec = (await getFirstEncodableVideoCodec(
        format.getSupportedVideoCodecs(),
        { width, height },
      )) as VideoCodec | null;
      if (!videoCodec) {
        throw new MoriLogDeviceMovieError(
          "ENCODER_UNAVAILABLE",
          "この端末では動画エンコードに対応していません。",
        );
      }

      let audioCodec: AudioCodec | null = null;
      if (input.audioMode === "original" || input.audioMode === "bgm") {
        audioCodec = (await getFirstEncodableAudioCodec(
          format.getSupportedAudioCodecs(),
        )) as AudioCodec | null;
        if (!audioCodec) {
          throw new MoriLogDeviceMovieError(
            input.audioMode === "bgm" ? "BGM_ENCODE_FAILED" : "AUDIO_DECODE_FAILED",
            input.audioMode === "bgm"
              ? "この端末では森の音楽付き動画を作れません。"
              : "この端末では元音声付き動画を作れません。「音なし」なら作成できる場合があります。",
          );
        }
      }

      let bgmBuffer: AudioBuffer | null = null;
      if (input.audioMode === "bgm" && bgmIdOut) {
        try {
          const loaded = await loadDeviceMovieBgmAudioBuffer({
            bgmId: bgmIdOut,
            durationSec: trim.durationSec,
            signal: input.signal,
          });
          bgmBuffer = loaded.buffer;
          bgmTrackName = loaded.track.title;
        } catch (error) {
          if (error instanceof MoriLogDeviceMovieError) throw error;
          throw new MoriLogDeviceMovieError(
            "BGM_ENCODE_FAILED",
            "森の音楽の準備に失敗しました。",
            error,
          );
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) {
        throw new MoriLogDeviceMovieError("ENCODE_FAILED", "キャンバスを作れませんでした。");
      }

      const target = new BufferTarget();
      const output = new Output({ format, target });
      const videoSource = new CanvasSource(canvas, {
        codec: videoCodec,
        bitrate: appleMobile ? 1_500_000 : 2_500_000,
        keyFrameInterval: 2,
      });
      output.addVideoTrack(videoSource);

      let audioSource: AudioBufferSource | null = null;
      if (
        (input.audioMode === "original" || input.audioMode === "bgm") &&
        audioCodec
      ) {
        audioSource = new AudioBufferSource({ codec: audioCodec, bitrate: 128_000 });
        output.addAudioTrack(audioSource);
      }

      await output.start();

      const sink = new VideoSampleSink(videoTrack);
      const clipDur = Math.max(0.001, trim.endSec - trim.startSec);
      let frameCount = 0;
      let posterBlob: Blob | null = null;

      const sourceW = probe.width || videoTrack.displayWidth || width;
      const sourceH = probe.height || videoTrack.displayHeight || height;

      for await (const sample of sink.samples(trim.startSec, trim.endSec)) {
        throwIfAborted(input.signal);
        try {
          paintDeviceMovieBasicFrame({
            ctx,
            layout,
            assets,
            sourceWidth: sample.displayWidth || sourceW,
            sourceHeight: sample.displayHeight || sourceH,
            title,
            dateKey,
            focusX,
            focusY,
            scale,
            drawVideo: ({ ctx: c, dx, dy, dw, dh }) => {
              sample.draw(c, dx, dy, dw, dh);
            },
          });

          if (!posterBlob) {
            posterBlob = await canvasToJpegBlob(canvas);
          }

          const relativeTs = Math.max(0, sample.timestamp - trim.startSec);
          const duration = Math.max(
            1 / 60,
            Number.isFinite(sample.duration) && sample.duration > 0
              ? sample.duration
              : 1 / 30,
          );
          await videoSource.add(relativeTs, duration);
          frameCount += 1;
          input.onProgress?.(Math.min(0.85, (relativeTs / clipDur) * 0.85));
        } finally {
          sample.close();
        }
      }

      if (frameCount <= 0) {
        throw new MoriLogDeviceMovieError(
          "VIDEO_DECODE_FAILED",
          "切り出し範囲から映像フレームを取得できませんでした。",
        );
      }

      if (audioSource && input.audioMode === "original") {
        const audioTrack = await encodeInput.getPrimaryAudioTrack();
        if (!audioTrack) {
          throw new MoriLogDeviceMovieError(
            "AUDIO_DECODE_FAILED",
            "音声トラックが見つかりませんでした。",
          );
        }
        const audioSink = new AudioBufferSink(audioTrack);
        for await (const wrapped of audioSink.buffers(trim.startSec, trim.endSec)) {
          throwIfAborted(input.signal);
          await audioSource.add(wrapped.buffer);
        }
      } else if (audioSource && input.audioMode === "bgm" && bgmBuffer) {
        try {
          await audioSource.add(bgmBuffer);
        } catch (cause) {
          throw new MoriLogDeviceMovieError(
            "BGM_ENCODE_FAILED",
            "森の音楽を動画へ載せられませんでした。",
            cause,
          );
        }
      }

      await output.finalize();
      const buffer = target.buffer;
      if (!buffer || buffer.byteLength <= 0) {
        throw new MoriLogDeviceMovieError("ENCODE_FAILED", "動画データが空でした。");
      }
      if (!posterBlob) {
        throw new MoriLogDeviceMovieError(
          "POSTER_CREATE_FAILED",
          "ポスター画像を作れませんでした。",
        );
      }

      input.onProgress?.(1);

      return {
        movieBlob: new Blob([new Uint8Array(buffer)], { type: "video/mp4" }),
        posterBlob,
        mimeType: "video/mp4",
        fileExtension: "mp4",
        durationSec: trim.durationSec,
        width,
        height,
        audioMode: input.audioMode,
        templateId: DEVICE_MOVIE_BASIC_TEMPLATE_ID,
        templateVersion: DEVICE_MOVIE_BASIC_TEMPLATE_VERSION,
        templateDecorationVariant: decorationVariant,
        createdDateKey: dateKey,
        bgmId: input.audioMode === "bgm" ? bgmIdOut : null,
        bgmName: input.audioMode === "bgm" ? bgmTrackName : null,
        diagnostics: {
          encoder: `mediabunny-template-canvas-mp4/device-movie-basic-v1`,
          sourceMimeType: probe.mimeType,
          sourceWidth: probe.width,
          sourceHeight: probe.height,
          sourceDurationSec: probe.durationSec,
          sourceRotationDeg: probe.rotationDeg,
        },
      };
    } catch (error) {
      if (error instanceof MoriLogDeviceMovieError) throw error;
      throw new MoriLogDeviceMovieError(
        "ENCODE_FAILED",
        `テンプレート合成の書き出しに失敗しました。（${errorDetail(error)}）`,
        error,
      );
    } finally {
      encodeInput.dispose();
    }
  } finally {
    probeInput.dispose();
  }
}
