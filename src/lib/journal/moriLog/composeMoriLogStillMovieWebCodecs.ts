/**
 * Mediabunny（WebCodecs）で静止画 + BGM → MP4。
 * iOS Safari の MediaRecorder（音声トラック付きが空になる問題）向けの本命経路。
 */

import {
  AudioBufferSource,
  BufferTarget,
  CanvasSource,
  Mp4OutputFormat,
  Output,
  Quality,
  getFirstEncodableAudioCodec,
  getFirstEncodableVideoCodec,
} from "mediabunny";

import type { ComposeMoriLogStillMovieInput, ComposeMoriLogStillMovieResult } from "@/lib/journal/moriLog/composeMoriLogStillMovie";

function drawCardFrame(
  ctx: CanvasRenderingContext2D,
  bitmap: ImageBitmap,
  width: number,
  height: number,
): void {
  ctx.fillStyle = "#f7f1e6";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
}

async function fetchArrayBuffer(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url, { credentials: "same-origin", cache: "force-cache" });
  if (!res.ok) {
    throw new Error("BGMを読み込めませんでした。");
  }
  return res.arrayBuffer();
}

function sliceAudioBuffer(buffer: AudioBuffer, durationSec: number): AudioBuffer {
  const sampleRate = buffer.sampleRate;
  const frameCount = Math.max(1, Math.min(buffer.length, Math.floor(durationSec * sampleRate)));
  const channels = buffer.numberOfChannels;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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

export function canComposeMoriLogStillMovieWithWebCodecs(): boolean {
  return (
    typeof VideoEncoder !== "undefined" &&
    typeof AudioEncoder !== "undefined" &&
    typeof VideoFrame !== "undefined"
  );
}

/**
 * WebCodecs が使える環境向け。失敗時は呼び出し側で MediaRecorder にフォールバック。
 */
export async function composeMoriLogStillMovieWithWebCodecs(
  input: ComposeMoriLogStillMovieInput,
): Promise<ComposeMoriLogStillMovieResult> {
  if (!canComposeMoriLogStillMovieWithWebCodecs()) {
    throw new Error("WebCodecs に対応していません。");
  }

  const durationSec = Math.min(15, Math.max(3, input.durationSec));
  const appleMobile =
    typeof navigator !== "undefined" &&
    (/iPad|iPhone|iPod/i.test(navigator.userAgent) ||
      (/Macintosh/i.test(navigator.userAgent) &&
        typeof navigator.maxTouchPoints === "number" &&
        navigator.maxTouchPoints > 1));
  const maxEdge = appleMobile ? 720 : 1080;
  // 静止画なので低 fps で十分（エンコード負荷・時間を抑える）
  const fps = appleMobile ? 2 : 4;

  const format = new Mp4OutputFormat({ fastStart: "in-memory" });
  const videoCodec = await getFirstEncodableVideoCodec(format.getSupportedVideoCodecs(), {
    width: maxEdge,
    height: maxEdge,
  });
  const audioCodec = await getFirstEncodableAudioCodec(format.getSupportedAudioCodecs());
  if (!videoCodec) {
    throw new Error("この端末では動画エンコードに対応していません。");
  }
  if (!audioCodec) {
    throw new Error("この端末では音声エンコードに対応していません。");
  }

  const bitmap = await createImageBitmap(input.imageBlob);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(2, Math.round(bitmap.width * scale) & ~1);
  const height = Math.max(2, Math.round(bitmap.height * scale) & ~1);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) {
    bitmap.close();
    throw new Error("動画用キャンバスを作れませんでした。");
  }

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) {
    bitmap.close();
    throw new Error("この端末では音声付き動画を作れません。");
  }

  const audioCtx = new AudioCtx();
  try {
    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }
    const decoded = await audioCtx.decodeAudioData(await fetchArrayBuffer(input.audioUrl));
    const audioBuffer = sliceAudioBuffer(decoded, durationSec);

    const target = new BufferTarget();
    const output = new Output({
      format,
      target,
    });

    const videoSource = new CanvasSource(canvas, {
      codec: videoCodec,
      quality: new Quality("medium"),
    });
    output.addVideoTrack(videoSource);

    const audioSource = new AudioBufferSource({
      codec: audioCodec,
      quality: new Quality("medium"),
    });
    output.addAudioTrack(audioSource);

    await output.start();

    drawCardFrame(ctx, bitmap, width, height);
    const frameDuration = 1 / fps;
    const frameCount = Math.max(1, Math.round(durationSec * fps));

    for (let i = 0; i < frameCount; i += 1) {
      drawCardFrame(ctx, bitmap, width, height);
      const timestamp = i * frameDuration;
      await videoSource.add(timestamp, frameDuration);
      input.onProgress?.(Math.min(0.95, (i + 1) / frameCount));
    }

    await audioSource.add(audioBuffer);
    await output.finalize();

    const buffer = target.buffer;
    if (!buffer || buffer.byteLength <= 0) {
      throw new Error("動画データが空でした。");
    }

    input.onProgress?.(1);
    return {
      blob: new Blob([buffer], { type: "video/mp4" }),
      mimeType: "video/mp4",
      extension: "mp4",
    };
  } finally {
    bitmap.close();
    await audioCtx.close().catch(() => undefined);
  }
}
