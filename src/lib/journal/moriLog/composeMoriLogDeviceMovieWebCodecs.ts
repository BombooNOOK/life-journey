/**
 * mediabunny Conversion による端末動画の切り出し・再エンコード。
 * 静止画＋BGM 用 compose とは分離。将来の枠オーバーレイは video.process で差し込める。
 */

import {
  ALL_FORMATS,
  AudioBufferSink,
  AudioBufferSource,
  BlobSource,
  BufferTarget,
  CanvasSource,
  Conversion,
  ConversionCanceledError,
  Input,
  Mp4OutputFormat,
  Output,
  Quality,
  VideoSampleSink,
  VideoSampleSource,
  WebMOutputFormat,
  getFirstEncodableAudioCodec,
  getFirstEncodableVideoCodec,
  type VideoCodec,
  type AudioCodec,
} from "mediabunny";

/** iPhone 実機で「コードが届いているか」を確認するための印 */
export const MORI_LOG_DEVICE_MOVIE_PIPELINE_BUILD = "canvas-v3-20260804c";

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
  resolveDeviceMovieOutputSize,
  resolveDeviceMovieTrim,
} from "@/lib/journal/moriLog/composeMoriLogDeviceMovieValidate";
import { probeMoriLogDeviceMovieSource } from "@/lib/journal/moriLog/composeMoriLogDeviceMovieProbe";

export function canComposeMoriLogDeviceMovieWithWebCodecs(): boolean {
  return (
    typeof VideoEncoder !== "undefined" &&
    typeof VideoDecoder !== "undefined" &&
    typeof VideoFrame !== "undefined"
  );
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new MoriLogDeviceMovieError("CANCELLED", "動画処理をキャンセルしました。");
  }
}

function errorDetail(error: unknown): string {
  if (error instanceof MoriLogDeviceMovieError) {
    const cause =
      error.cause instanceof Error
        ? error.cause.message
        : error.cause != null
          ? String(error.cause)
          : "";
    return cause ? `${error.message} | cause: ${cause}` : error.message;
  }
  if (error instanceof Error) {
    const cause =
      "cause" in error && error.cause instanceof Error
        ? error.cause.message
        : "";
    return cause ? `${error.message} | cause: ${cause}` : error.message;
  }
  return String(error);
}

function discardedSummary(
  discarded: ReadonlyArray<{ reason?: string; track?: { codec?: string | null } }>,
): string {
  if (!discarded.length) return "";
  return discarded
    .map((d) => `${d.track?.codec ?? "track"}:${d.reason ?? "unknown"}`)
    .join(", ");
}

/**
 * focus/scale から cover 前のクロップ矩形を推定（0..1 座標系は表示サイズ基準）。
 * scale<=1 のときはクロップしない。
 */
export function resolveDeviceMovieCrop(options: {
  displayWidth: number;
  displayHeight: number;
  focusX: number;
  focusY: number;
  scale: number;
}): { left: number; top: number; width: number; height: number } | undefined {
  const scale = Math.max(1, options.scale);
  if (scale <= 1.001) return undefined;

  const w = Math.max(1, options.displayWidth);
  const h = Math.max(1, options.displayHeight);
  const cropW = Math.max(2, Math.floor(w / scale));
  const cropH = Math.max(2, Math.floor(h / scale));
  const focusX = Math.min(1, Math.max(0, options.focusX));
  const focusY = Math.min(1, Math.max(0, options.focusY));
  const left = Math.min(w - cropW, Math.max(0, Math.round(focusX * w - cropW / 2)));
  const top = Math.min(h - cropH, Math.max(0, Math.round(focusY * h - cropH / 2)));
  return { left, top, width: cropW, height: cropH };
}

async function createPosterJpeg(options: {
  input: Input;
  startSec: number;
  endSec: number;
  outWidth: number;
  outHeight: number;
  signal?: AbortSignal;
}): Promise<Blob> {
  throwIfAborted(options.signal);
  const videoTrack = await options.input.getPrimaryVideoTrack();
  if (!videoTrack) {
    throw new MoriLogDeviceMovieError(
      "POSTER_CREATE_FAILED",
      "ポスター用の映像を取得できませんでした。",
    );
  }

  const sink = new VideoSampleSink(videoTrack);
  const preferred = Math.min(options.endSec - 1e-3, options.startSec + 0.1);
  const timestamp = Math.max(options.startSec, preferred);

  let sample = await sink.getSample(timestamp);
  if (!sample) {
    sample = await sink.getSample(options.startSec);
  }
  if (!sample) {
    throw new MoriLogDeviceMovieError(
      "POSTER_CREATE_FAILED",
      "ポスター画像を作れませんでした。",
    );
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.width = options.outWidth;
    canvas.height = options.outHeight;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) {
      throw new MoriLogDeviceMovieError(
        "POSTER_CREATE_FAILED",
        "ポスター用キャンバスを作れませんでした。",
      );
    }

    const dw = sample.displayWidth || sample.codedWidth || options.outWidth;
    const dh = sample.displayHeight || sample.codedHeight || options.outHeight;
    const cover = Math.max(options.outWidth / dw, options.outHeight / dh);
    const drawW = dw * cover;
    const drawH = dh * cover;
    const dx = (options.outWidth - drawW) / 2;
    const dy = (options.outHeight - drawH) / 2;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, options.outWidth, options.outHeight);
    sample.draw(ctx, dx, dy, drawW, drawH);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b && b.size > 0) resolve(b);
          else reject(new Error("empty poster"));
        },
        "image/jpeg",
        0.9,
      );
    });
    return blob;
  } catch (cause) {
    if (cause instanceof MoriLogDeviceMovieError) throw cause;
    throw new MoriLogDeviceMovieError(
      "POSTER_CREATE_FAILED",
      "ポスター画像を作れませんでした。",
      cause,
    );
  } finally {
    sample.close();
  }
}

type FormatCandidate = {
  label: string;
  mime: string;
  ext: "mp4" | "webm";
  createFormat: () => Mp4OutputFormat | WebMOutputFormat;
};

async function encodeOnce(options: {
  source: Blob;
  startSec: number;
  endSec: number;
  audioMode: ComposeMoriLogDeviceMovieInput["audioMode"];
  outWidth: number;
  outHeight: number;
  crop?: { left: number; top: number; width: number; height: number };
  candidate: FormatCandidate;
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
}): Promise<{ blob: Blob; mimeType: string; extension: "mp4" | "webm"; encoder: string }> {
  throwIfAborted(options.signal);

  const input = new Input({
    source: new BlobSource(options.source),
    formats: ALL_FORMATS,
  });

  let conversion: Conversion | null = null;
  const onAbort = () => {
    void conversion?.cancel().catch(() => undefined);
  };

  try {
    const videoTrack = await input.getPrimaryVideoTrack();
    if (!videoTrack) {
      throw new MoriLogDeviceMovieError(
        "SOURCE_UNSUPPORTED",
        "映像トラックが見つかりませんでした。",
      );
    }
    if (!(await videoTrack.canDecode())) {
      throw new MoriLogDeviceMovieError(
        "VIDEO_DECODE_FAILED",
        "この端末では映像を解読できません。",
      );
    }

    const audioTrack = await input.getPrimaryAudioTrack();
    if (options.audioMode === "original") {
      if (!audioTrack) {
        throw new MoriLogDeviceMovieError(
          "AUDIO_DECODE_FAILED",
          "この動画に音声がありません。「音なし」なら作成できる場合があります。",
        );
      }
      if (!(await audioTrack.canDecode())) {
        throw new MoriLogDeviceMovieError(
          "AUDIO_DECODE_FAILED",
          "この動画の音声形式には対応していません。「音なし」なら作成できる場合があります。",
        );
      }
    }

    const format = options.candidate.createFormat();
    const videoCodec = (await getFirstEncodableVideoCodec(format.getSupportedVideoCodecs(), {
      width: options.outWidth,
      height: options.outHeight,
    })) as VideoCodec | null;
    if (!videoCodec) {
      throw new MoriLogDeviceMovieError(
        "ENCODER_UNAVAILABLE",
        "この端末では動画エンコードに対応していません。",
      );
    }

    let audioCodec: AudioCodec | null = null;
    if (options.audioMode === "original") {
      audioCodec = (await getFirstEncodableAudioCodec(
        format.getSupportedAudioCodecs(),
      )) as AudioCodec | null;
      if (!audioCodec) {
        throw new MoriLogDeviceMovieError(
          "AUDIO_DECODE_FAILED",
          "この端末では元音声付き動画を作れません。「音なし」なら作成できる場合があります。",
        );
      }
    }

    const target = new BufferTarget();
    const output = new Output({
      format,
      target,
    });

    const apple = isLikelyAppleMobileForDeviceMovie();
    conversion = await Conversion.init({
      input,
      output,
      tracks: "primary",
      showWarnings: false,
      trim: {
        start: options.startSec,
        end: options.endSec,
      },
      video: {
        width: options.outWidth,
        height: options.outHeight,
        fit: "cover",
        crop: options.crop,
        allowRotationMetadata: false,
        forceTranscode: true,
        quality: new Quality("medium"),
        codec: videoCodec,
        // iOS では HW 優先の方が安定しやすいことがある
        hardwareAcceleration: apple ? "prefer-hardware" : "no-preference",
        keyFrameInterval: apple ? 2 : undefined,
        // 将来の森ログ装飾オーバーレイ差し込み口（現状は通過）
        process: (sample) => sample,
      },
      audio:
        options.audioMode === "mute"
          ? { discard: true }
          : {
              forceTranscode: true,
              quality: new Quality("medium"),
              codec: audioCodec ?? undefined,
            },
    });

    if (options.signal) {
      options.signal.addEventListener("abort", onAbort, { once: true });
    }

    if (!conversion.isValid) {
      const why = discardedSummary(conversion.discardedTracks);
      throw new MoriLogDeviceMovieError(
        "ENCODE_FAILED",
        `この組み合わせでは動画を作れませんでした。${why ? `（${why}）` : ""} [${options.candidate.label} ${videoCodec}/${audioCodec ?? "no-audio"} ${options.outWidth}x${options.outHeight}]`,
      );
    }

    conversion.onProgress = (progress) => {
      options.onProgress?.(Math.min(0.9, Math.max(0, progress) * 0.9));
    };

    try {
      await conversion.execute();
    } catch (executeError) {
      if (executeError instanceof ConversionCanceledError || options.signal?.aborted) {
        throw new MoriLogDeviceMovieError("CANCELLED", "動画処理をキャンセルしました。", executeError);
      }
      throw new MoriLogDeviceMovieError(
        "ENCODE_FAILED",
        `書き出し実行に失敗しました。（${errorDetail(executeError)}）[${options.candidate.label} ${videoCodec}/${audioCodec ?? "no-audio"} ${options.outWidth}x${options.outHeight}]`,
        executeError,
      );
    }

    const buffer = target.buffer;
    if (!buffer || buffer.byteLength <= 0) {
      throw new MoriLogDeviceMovieError("ENCODE_FAILED", "動画データが空でした。");
    }

    return {
      blob: new Blob([new Uint8Array(buffer)], { type: options.candidate.mime }),
      mimeType: options.candidate.mime,
      extension: options.candidate.ext,
      encoder: options.candidate.label,
    };
  } catch (error) {
    if (error instanceof ConversionCanceledError || options.signal?.aborted) {
      throw new MoriLogDeviceMovieError("CANCELLED", "動画処理をキャンセルしました。", error);
    }
    if (error instanceof MoriLogDeviceMovieError) throw error;
    throw new MoriLogDeviceMovieError(
      "ENCODE_FAILED",
      `動画の書き出しに失敗しました。（${errorDetail(error)}）`,
      error,
    );
  } finally {
    if (options.signal) {
      options.signal.removeEventListener("abort", onAbort);
    }
    input.dispose();
  }
}

/**
 * iOS Safari 向け本命：VideoSampleSource（静止画ムービーと同系統の Output + WebCodecs）。
 * Conversion は WebKit で Type error になりやすいので、iPhone では使わない。
 */
async function encodeWithSamplePipeline(options: {
  source: Blob;
  startSec: number;
  endSec: number;
  audioMode: ComposeMoriLogDeviceMovieInput["audioMode"];
  outWidth: number;
  outHeight: number;
  crop?: { left: number; top: number; width: number; height: number };
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
}): Promise<{ blob: Blob; mimeType: string; extension: "mp4" | "webm"; encoder: string }> {
  throwIfAborted(options.signal);

  const input = new Input({
    source: new BlobSource(options.source),
    formats: ALL_FORMATS,
  });

  let lastEncoderConfig: VideoEncoderConfig | undefined;

  try {
    const videoTrack = await input.getPrimaryVideoTrack();
    if (!videoTrack) {
      throw new MoriLogDeviceMovieError(
        "SOURCE_UNSUPPORTED",
        "映像トラックが見つかりませんでした。",
      );
    }
    if (!(await videoTrack.canDecode())) {
      throw new MoriLogDeviceMovieError(
        "VIDEO_DECODE_FAILED",
        "この端末では映像を解読できません。",
      );
    }

    const audioTrack = await input.getPrimaryAudioTrack();
    if (options.audioMode === "original") {
      if (!audioTrack) {
        throw new MoriLogDeviceMovieError(
          "AUDIO_DECODE_FAILED",
          "この動画に音声がありません。「音なし」なら作成できる場合があります。",
        );
      }
      if (!(await audioTrack.canDecode())) {
        throw new MoriLogDeviceMovieError(
          "AUDIO_DECODE_FAILED",
          "この動画の音声形式には対応していません。「音なし」なら作成できる場合があります。",
        );
      }
    }

    const format = new Mp4OutputFormat({ fastStart: "in-memory" });
    const videoCodec = (await getFirstEncodableVideoCodec(format.getSupportedVideoCodecs(), {
      width: options.outWidth,
      height: options.outHeight,
    })) as VideoCodec | null;
    if (!videoCodec) {
      // 追加診断：素の VideoEncoder が何を受け付けるか
      let supportHint = "";
      if (typeof VideoEncoder !== "undefined" && typeof VideoEncoder.isConfigSupported === "function") {
        try {
          const probed = await VideoEncoder.isConfigSupported({
            codec: "avc1.42E01E",
            width: options.outWidth,
            height: options.outHeight,
            bitrate: 1_500_000,
            framerate: 30,
          });
          supportHint = ` isConfigSupported(avc1.42E01E ${options.outWidth}x${options.outHeight})=${probed.supported}`;
        } catch (probeError) {
          supportHint = ` isConfigSupported threw (${errorDetail(probeError)})`;
        }
      }
      throw new MoriLogDeviceMovieError(
        "ENCODER_UNAVAILABLE",
        `この端末では動画エンコードに対応していません。${supportHint}`,
      );
    }

    let audioCodec: AudioCodec | null = null;
    if (options.audioMode === "original") {
      audioCodec = (await getFirstEncodableAudioCodec(
        format.getSupportedAudioCodecs(),
      )) as AudioCodec | null;
      if (!audioCodec) {
        throw new MoriLogDeviceMovieError(
          "AUDIO_DECODE_FAILED",
          "この端末では元音声付き動画を作れません。「音なし」なら作成できる場合があります。",
        );
      }
    }

    const target = new BufferTarget();
    const output = new Output({ format, target });

    const videoSource = new VideoSampleSource({
      codec: videoCodec,
      // Quality 経由より bitrate 明示の方が WebKit で安定することがある
      bitrate: 1_500_000,
      keyFrameInterval: 2,
      sizeChangeBehavior: "deny",
      transform: {
        width: options.outWidth,
        height: options.outHeight,
        fit: "cover",
        ...(options.crop ? { crop: options.crop } : {}),
        force: true,
        alpha: "discard",
      },
      onEncoderConfig: (config) => {
        lastEncoderConfig = config;
      },
    });
    output.addVideoTrack(videoSource);

    let audioSource: AudioBufferSource | null = null;
    if (options.audioMode === "original" && audioCodec) {
      audioSource = new AudioBufferSource({
        codec: audioCodec,
        bitrate: 128_000,
      });
      output.addAudioTrack(audioSource);
    }

    try {
      await output.start();
    } catch (error) {
      throw new MoriLogDeviceMovieError(
        "ENCODER_UNAVAILABLE",
        `エンコーダ開始に失敗しました。（${errorDetail(error)}） codec=${videoCodec} ${options.outWidth}x${options.outHeight} config=${JSON.stringify(lastEncoderConfig ?? null)}`,
        error,
      );
    }

    const sink = new VideoSampleSink(videoTrack);
    const clipDur = Math.max(0.001, options.endSec - options.startSec);
    let frameCount = 0;

    try {
      for await (const sample of sink.samples(options.startSec, options.endSec)) {
        throwIfAborted(options.signal);
        try {
          const relativeTs = Math.max(0, sample.timestamp - options.startSec);
          sample.setTimestamp(relativeTs);
          await videoSource.add(sample);
          frameCount += 1;
          options.onProgress?.(Math.min(0.85, (relativeTs / clipDur) * 0.85));
        } finally {
          sample.close();
        }
      }
    } catch (error) {
      if (error instanceof MoriLogDeviceMovieError) throw error;
      throw new MoriLogDeviceMovieError(
        "VIDEO_DECODE_FAILED",
        `映像フレームの処理に失敗しました。（${errorDetail(error)}） frames=${frameCount} config=${JSON.stringify(lastEncoderConfig ?? null)}`,
        error,
      );
    }

    if (frameCount <= 0) {
      throw new MoriLogDeviceMovieError(
        "VIDEO_DECODE_FAILED",
        "切り出し範囲から映像フレームを取得できませんでした。",
      );
    }

    if (audioSource && audioTrack) {
      try {
        const audioSink = new AudioBufferSink(audioTrack);
        let audioChunks = 0;
        for await (const wrapped of audioSink.buffers(options.startSec, options.endSec)) {
          throwIfAborted(options.signal);
          await audioSource.add(wrapped.buffer);
          audioChunks += 1;
        }
        if (audioChunks <= 0) {
          throw new MoriLogDeviceMovieError(
            "AUDIO_DECODE_FAILED",
            "この動画の音声を読み取れませんでした。「音なし」なら作成できる場合があります。",
          );
        }
      } catch (error) {
        if (error instanceof MoriLogDeviceMovieError) throw error;
        throw new MoriLogDeviceMovieError(
          "AUDIO_DECODE_FAILED",
          `音声の処理に失敗しました。（${errorDetail(error)}）「音なし」なら作成できる場合があります。`,
          error,
        );
      }
    }

    options.onProgress?.(0.9);
    try {
      await output.finalize();
    } catch (error) {
      throw new MoriLogDeviceMovieError(
        "ENCODE_FAILED",
        `MP4 の確定に失敗しました。（${errorDetail(error)}） frames=${frameCount}`,
        error,
      );
    }

    const buffer = target.buffer;
    if (!buffer || buffer.byteLength <= 0) {
      throw new MoriLogDeviceMovieError("ENCODE_FAILED", "動画データが空でした。");
    }

    return {
      blob: new Blob([new Uint8Array(buffer)], { type: "video/mp4" }),
      mimeType: "video/mp4",
      extension: "mp4",
      encoder: `mediabunny-sample-mp4/${MORI_LOG_DEVICE_MOVIE_PIPELINE_BUILD}`,
    };
  } finally {
    input.dispose();
  }
}

/** sample → canvas の順で試す（iPhone）。失敗時は両方の理由を載せる。 */
async function encodeWithCanvasPipeline(
  options: Parameters<typeof encodeWithSamplePipeline>[0],
): Promise<{ blob: Blob; mimeType: string; extension: "mp4" | "webm"; encoder: string }> {
  let sampleError: unknown;
  try {
    return await encodeWithSamplePipeline(options);
  } catch (error) {
    if (
      error instanceof MoriLogDeviceMovieError &&
      (error.code === "CANCELLED" || error.code === "AUDIO_DECODE_FAILED")
    ) {
      throw error;
    }
    sampleError = error;
  }

  throwIfAborted(options.signal);
  const input = new Input({
    source: new BlobSource(options.source),
    formats: ALL_FORMATS,
  });

  try {
    const videoTrack = await input.getPrimaryVideoTrack();
    if (!videoTrack || !(await videoTrack.canDecode())) {
      throw new MoriLogDeviceMovieError("VIDEO_DECODE_FAILED", "映像を解読できませんでした。");
    }
    const format = new Mp4OutputFormat({ fastStart: "in-memory" });
    const videoCodec = (await getFirstEncodableVideoCodec(format.getSupportedVideoCodecs(), {
      width: options.outWidth,
      height: options.outHeight,
    })) as VideoCodec | null;
    if (!videoCodec) {
      throw new MoriLogDeviceMovieError("ENCODER_UNAVAILABLE", "動画エンコード非対応です。");
    }

    const canvas = document.createElement("canvas");
    canvas.width = options.outWidth;
    canvas.height = options.outHeight;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) {
      throw new MoriLogDeviceMovieError("ENCODE_FAILED", "キャンバスを作れませんでした。");
    }

    const target = new BufferTarget();
    const output = new Output({ format, target });
    const videoSource = new CanvasSource(canvas, {
      codec: videoCodec,
      bitrate: 1_500_000,
      keyFrameInterval: 2,
    });
    output.addVideoTrack(videoSource);

    if (options.audioMode === "original") {
      const audioTrack = await input.getPrimaryAudioTrack();
      const audioCodec = (await getFirstEncodableAudioCodec(
        format.getSupportedAudioCodecs(),
      )) as AudioCodec | null;
      if (!audioTrack || !(await audioTrack.canDecode()) || !audioCodec) {
        throw new MoriLogDeviceMovieError(
          "AUDIO_DECODE_FAILED",
          "元音声を処理できません。「音なし」なら作成できる場合があります。",
        );
      }
      const audioSource = new AudioBufferSource({ codec: audioCodec, bitrate: 128_000 });
      output.addAudioTrack(audioSource);
      await output.start();
      const sink = new VideoSampleSink(videoTrack);
      const clipDur = Math.max(0.001, options.endSec - options.startSec);
      let frameCount = 0;
      for await (const sample of sink.samples(options.startSec, options.endSec)) {
        throwIfAborted(options.signal);
        try {
          ctx.fillStyle = "#000000";
          ctx.fillRect(0, 0, options.outWidth, options.outHeight);
          if (options.crop) {
            sample.drawWithFit(ctx, { fit: "cover", crop: options.crop });
          } else {
            sample.drawWithFit(ctx, { fit: "cover" });
          }
          const relativeTs = Math.max(0, sample.timestamp - options.startSec);
          const duration = Math.max(
            1 / 60,
            Number.isFinite(sample.duration) && sample.duration > 0 ? sample.duration : 1 / 30,
          );
          await videoSource.add(relativeTs, duration);
          frameCount += 1;
          options.onProgress?.(Math.min(0.85, (relativeTs / clipDur) * 0.85));
        } finally {
          sample.close();
        }
      }
      if (frameCount <= 0) {
        throw new MoriLogDeviceMovieError("VIDEO_DECODE_FAILED", "フレームを取得できませんでした。");
      }
      const audioSink = new AudioBufferSink(audioTrack);
      for await (const wrapped of audioSink.buffers(options.startSec, options.endSec)) {
        await audioSource.add(wrapped.buffer);
      }
    } else {
      await output.start();
      const sink = new VideoSampleSink(videoTrack);
      const clipDur = Math.max(0.001, options.endSec - options.startSec);
      let frameCount = 0;
      for await (const sample of sink.samples(options.startSec, options.endSec)) {
        throwIfAborted(options.signal);
        try {
          ctx.fillStyle = "#000000";
          ctx.fillRect(0, 0, options.outWidth, options.outHeight);
          sample.drawWithFit(ctx, { fit: "cover" });
          const relativeTs = Math.max(0, sample.timestamp - options.startSec);
          const duration = Math.max(
            1 / 60,
            Number.isFinite(sample.duration) && sample.duration > 0 ? sample.duration : 1 / 30,
          );
          await videoSource.add(relativeTs, duration);
          frameCount += 1;
          options.onProgress?.(Math.min(0.85, (relativeTs / clipDur) * 0.85));
        } finally {
          sample.close();
        }
      }
      if (frameCount <= 0) {
        throw new MoriLogDeviceMovieError("VIDEO_DECODE_FAILED", "フレームを取得できませんでした。");
      }
    }

    await output.finalize();
    const buffer = target.buffer;
    if (!buffer || buffer.byteLength <= 0) {
      throw new MoriLogDeviceMovieError("ENCODE_FAILED", "動画データが空でした。");
    }
    return {
      blob: new Blob([new Uint8Array(buffer)], { type: "video/mp4" }),
      mimeType: "video/mp4",
      extension: "mp4",
      encoder: `mediabunny-canvas-mp4/${MORI_LOG_DEVICE_MOVIE_PIPELINE_BUILD}`,
    };
  } catch (error) {
    const sampleMsg = sampleError != null ? ` | sample経路: ${errorDetail(sampleError)}` : "";
    if (error instanceof MoriLogDeviceMovieError) {
      throw new MoriLogDeviceMovieError(
        error.code,
        `${error.message}${sampleMsg} | build=${MORI_LOG_DEVICE_MOVIE_PIPELINE_BUILD}`,
        error.cause ?? error,
      );
    }
    throw new MoriLogDeviceMovieError(
      "ENCODE_FAILED",
      `canvas経路に失敗しました。（${errorDetail(error)}）${sampleMsg} | build=${MORI_LOG_DEVICE_MOVIE_PIPELINE_BUILD}`,
      error,
    );
  } finally {
    input.dispose();
  }
}

export async function composeMoriLogDeviceMovieWithWebCodecs(
  input: ComposeMoriLogDeviceMovieInput,
): Promise<ComposeMoriLogDeviceMovieResult> {
  if (!canComposeMoriLogDeviceMovieWithWebCodecs()) {
    throw new MoriLogDeviceMovieError(
      "ENCODER_UNAVAILABLE",
      "この端末では WebCodecs 動画エンコードに対応していません。",
    );
  }

  if (input.audioMode === "bgm") {
    throw new MoriLogDeviceMovieError(
      "ENCODER_UNAVAILABLE",
      "BGM モードはこの基盤では未対応です。",
    );
  }

  throwIfAborted(input.signal);
  assertDeviceMovieSourceSize(input.source.size);

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
    const maxEdge = appleMobile ? 720 : 1080;
    const { width, height } = resolveDeviceMovieOutputSize({
      displayWidth: probe.width,
      displayHeight: probe.height,
      maxEdge,
      // iPhone VideoEncoder はマクロブロック境界（16）を要求することがある
      multipleOf: appleMobile ? 16 : 2,
    });

    const focusX = input.focusX ?? MORI_LOG_DEVICE_MOVIE_DEFAULT_FOCUS_X;
    const focusY = input.focusY ?? MORI_LOG_DEVICE_MOVIE_DEFAULT_FOCUS_Y;
    const scale = input.scale ?? MORI_LOG_DEVICE_MOVIE_DEFAULT_SCALE;
    const crop = resolveDeviceMovieCrop({
      displayWidth: probe.width,
      displayHeight: probe.height,
      focusX,
      focusY,
      scale,
    });

    const tryCanvasFirst = appleMobile;
    if (tryCanvasFirst) {
      // iPhone/Safari では Conversion の Type error を踏むので sample/canvas のみ。
      return await (async () => {
        const encodedApple = await encodeWithCanvasPipeline({
          source: input.source,
          startSec: trim.startSec,
          endSec: trim.endSec,
          audioMode: input.audioMode,
          outWidth: width,
          outHeight: height,
          crop,
          signal: input.signal,
          onProgress: input.onProgress,
        });

        input.onProgress?.(0.92);
        const posterProbe = await probeMoriLogDeviceMovieSource(input.source);
        let posterBlob: Blob;
        try {
          posterBlob = await createPosterJpeg({
            input: posterProbe.input,
            startSec: trim.startSec,
            endSec: trim.endSec,
            outWidth: width,
            outHeight: height,
            signal: input.signal,
          });
        } finally {
          posterProbe.input.dispose();
        }
        input.onProgress?.(1);
        return {
          movieBlob: encodedApple.blob,
          posterBlob,
          mimeType: encodedApple.mimeType,
          fileExtension: encodedApple.extension,
          durationSec: trim.durationSec,
          width,
          height,
          audioMode: input.audioMode,
          diagnostics: {
            encoder: encodedApple.encoder,
            sourceMimeType: probe.mimeType,
            sourceWidth: probe.width,
            sourceHeight: probe.height,
            sourceDurationSec: probe.durationSec,
            sourceRotationDeg: probe.rotationDeg,
          },
        };
      })();
    }

    let encoded: {
      blob: Blob;
      mimeType: string;
      extension: "mp4" | "webm";
      encoder: string;
    } | null = null;
    let lastError: unknown;

    if (!encoded) {
      const candidates: FormatCandidate[] = [
        {
          label: "mediabunny-conversion-mp4",
          mime: "video/mp4",
          ext: "mp4",
          createFormat: () => new Mp4OutputFormat({ fastStart: "in-memory" }),
        },
        {
          label: "mediabunny-conversion-webm",
          mime: "video/webm",
          ext: "webm",
          createFormat: () => new WebMOutputFormat(),
        },
      ];

      for (const candidate of candidates) {
        try {
          encoded = await encodeOnce({
            source: input.source,
            startSec: trim.startSec,
            endSec: trim.endSec,
            audioMode: input.audioMode,
            outWidth: width,
            outHeight: height,
            crop,
            candidate,
            signal: input.signal,
            onProgress: input.onProgress,
          });
          break;
        } catch (error) {
          if (error instanceof MoriLogDeviceMovieError) {
            if (
              error.code === "CANCELLED" ||
              error.code === "AUDIO_DECODE_FAILED" ||
              error.code === "VIDEO_DECODE_FAILED" ||
              error.code === "SOURCE_UNSUPPORTED"
            ) {
              throw error;
            }
            lastError = error;
            continue;
          }
          lastError = error;
        }
      }
    }

    // 非 Apple で Conversion 失敗時も canvas を最終手段に
    if (!encoded && !tryCanvasFirst) {
      try {
        encoded = await encodeWithCanvasPipeline({
          source: input.source,
          startSec: trim.startSec,
          endSec: trim.endSec,
          audioMode: input.audioMode,
          outWidth: width,
          outHeight: height,
          crop,
          signal: input.signal,
          onProgress: input.onProgress,
        });
      } catch (error) {
        lastError = error;
      }
    }

    if (!encoded) {
      if (lastError instanceof MoriLogDeviceMovieError) throw lastError;
      throw new MoriLogDeviceMovieError(
        "ENCODE_FAILED",
        `動画の書き出しに失敗しました。（${errorDetail(lastError)}）`,
        lastError,
      );
    }

    input.onProgress?.(0.92);
    // ポスター用に別 Input（encode 側で dispose 済み）
    const posterProbe = await probeMoriLogDeviceMovieSource(input.source);
    let posterBlob: Blob;
    try {
      posterBlob = await createPosterJpeg({
        input: posterProbe.input,
        startSec: trim.startSec,
        endSec: trim.endSec,
        outWidth: width,
        outHeight: height,
        signal: input.signal,
      });
    } finally {
      posterProbe.input.dispose();
    }

    input.onProgress?.(1);

    return {
      movieBlob: encoded.blob,
      posterBlob,
      mimeType: encoded.mimeType,
      fileExtension: encoded.extension,
      durationSec: trim.durationSec,
      width,
      height,
      audioMode: input.audioMode,
      diagnostics: {
        encoder: encoded.encoder,
        sourceMimeType: probe.mimeType,
        sourceWidth: probe.width,
        sourceHeight: probe.height,
        sourceDurationSec: probe.durationSec,
        sourceRotationDeg: probe.rotationDeg,
      },
    };
  } finally {
    probeInput.dispose();
  }
}
