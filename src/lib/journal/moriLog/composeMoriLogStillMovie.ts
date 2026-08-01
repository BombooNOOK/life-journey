/**
 * 森ログムービー MVP：静止画カード + BGM → MediaRecorder で短い動画
 * （ブラウザにより mp4 / webm。拡張子は実 MIME に合わせる）
 *
 * 先頭フレームはカード画像（サムネ・再生開始が真っ黒にならないよう、録画前に描画する）
 *
 * iOS Safari 注意:
 * - onstop のあとに最終 dataavailable が届くことがある（空 Blob 誤判定の主因）
 * - WebAudio の音声トラックを足すと録画全体が空になる端末がある → 空なら映像のみで再試行
 */

export const MORI_LOG_MOVIE_MIME_CANDIDATES = [
  "video/mp4;codecs=avc1.42E01F,mp4a.40.2",
  "video/mp4",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
] as const;

export function pickMoriLogMovieMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  if (typeof MediaRecorder.isTypeSupported !== "function") {
    return "video/mp4";
  }
  for (const mime of MORI_LOG_MOVIE_MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  // Safari は isTypeSupported が全部 false でもデフォルトで録れることがある
  return "";
}

export function moriLogMovieExtensionForMime(mimeType: string): "mp4" | "webm" {
  return mimeType.includes("webm") ? "webm" : "mp4";
}

function isLikelyAppleMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/i.test(ua)) return true;
  return /Macintosh/i.test(ua) && typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 1;
}

function isLikelySafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isSafari = /Safari/i.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS|OPiOS|Android/i.test(ua);
  return isSafari || isLikelyAppleMobile();
}

function createMediaRecorder(stream: MediaStream, mimeType: string): MediaRecorder {
  // Safari は mimeType / bitrate 指定で空データや失敗になりやすい → 素の生成を先に試す
  const attempts: MediaRecorderOptions[] = isLikelySafari()
    ? [{}, mimeType ? { mimeType } : {}, mimeType ? { mimeType, videoBitsPerSecond: 1_500_000 } : {}]
    : [
        mimeType ? { mimeType, videoBitsPerSecond: 2_500_000, audioBitsPerSecond: 128_000 } : {},
        mimeType ? { mimeType, videoBitsPerSecond: 1_500_000 } : {},
        mimeType ? { mimeType } : {},
        {},
      ];

  let lastError: unknown;
  for (const options of attempts) {
    try {
      return new MediaRecorder(stream, options);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("この端末では動画の録画を開始できません。");
}

export type ComposeMoriLogStillMovieInput = {
  imageBlob: Blob;
  /** /audio/... など */
  audioUrl: string;
  durationSec: number;
  /** BGM のフェードイン秒（映像は最初からカードを表示） */
  audioFadeInSec?: number;
  /** BGM のフェードアウト秒 */
  audioFadeOutSec?: number;
  /** 0..1 */
  onProgress?: (ratio: number) => void;
};

export type ComposeMoriLogStillMovieResult = {
  blob: Blob;
  mimeType: string;
  extension: "mp4" | "webm";
  /** Safari フォールバックで BGM を載せられなかった場合 true */
  audioOmitted?: boolean;
};

function loadImageBitmap(blob: Blob): Promise<ImageBitmap> {
  return createImageBitmap(blob);
}

async function fetchArrayBuffer(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url, { credentials: "same-origin", cache: "force-cache" });
  if (!res.ok) {
    throw new Error("BGMを読み込めませんでした。");
  }
  return res.arrayBuffer();
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

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

/**
 * iOS Safari: onstop のあとに最終チャンクが来る。すぐ resolve すると空 Blob になる。
 */
function waitForRecorderBlob(
  recorder: MediaRecorder,
  chunks: BlobPart[],
  resultMime: string,
  settleMs: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    let stopped = false;
    let settled = false;
    let settleTimer: number | null = null;

    const finish = () => {
      if (settled) return;
      settled = true;
      if (settleTimer != null) window.clearTimeout(settleTimer);
      resolve(new Blob(chunks, { type: resultMime || recorder.mimeType || "video/mp4" }));
    };

    const scheduleFinish = () => {
      if (settleTimer != null) window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(finish, settleMs);
    };

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
      if (stopped) scheduleFinish();
    };

    recorder.onerror = () => {
      if (settled) return;
      settled = true;
      if (settleTimer != null) window.clearTimeout(settleTimer);
      reject(new Error("動画の録画に失敗しました。"));
    };

    recorder.onstop = () => {
      stopped = true;
      scheduleFinish();
    };
  });
}

type RecordPassResult = {
  blob: Blob;
  mimeType: string;
  withAudio: boolean;
};

async function recordStillPass(options: {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  bitmap: ImageBitmap;
  width: number;
  height: number;
  fps: number;
  durationSec: number;
  mimeType: string;
  appleMobile: boolean;
  includeAudio: boolean;
  audioUrl: string;
  audioFadeInSec: number;
  audioFadeOutSec: number;
  onProgress?: (ratio: number) => void;
}): Promise<RecordPassResult> {
  const {
    canvas,
    ctx,
    bitmap,
    width,
    height,
    fps,
    durationSec,
    mimeType,
    appleMobile,
    includeAudio,
    audioUrl,
    audioFadeInSec,
    audioFadeOutSec,
    onProgress,
  } = options;

  drawCardFrame(ctx, bitmap, width, height);

  let audioCtx: AudioContext | null = null;
  let source: AudioBufferSourceNode | null = null;
  let keepAliveOsc: OscillatorNode | null = null;

  try {
    const canvasStream = canvas.captureStream(fps);
    const videoTrack = canvasStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = true;
      // Safari: 静止画キャンバスでもフレームを明示的に出す
      const trackWithFrame = videoTrack as MediaStreamTrack & { requestFrame?: () => void };
      try {
        trackWithFrame.requestFrame?.();
      } catch {
        // ignore
      }
    }

    const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];

    if (includeAudio) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        throw new Error("この端末では音声付き動画を作れません。");
      }
      audioCtx = new AudioCtx();
      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }

      const dest = audioCtx.createMediaStreamDestination();

      // Safari: 無音トラック扱いを避けるための極小キープアライブ
      const silentGain = audioCtx.createGain();
      silentGain.gain.value = 0.0001;
      keepAliveOsc = audioCtx.createOscillator();
      keepAliveOsc.frequency.value = 440;
      keepAliveOsc.connect(silentGain);
      silentGain.connect(dest);
      keepAliveOsc.start();

      const audioBuffer = await audioCtx.decodeAudioData(await fetchArrayBuffer(audioUrl));
      const gain = audioCtx.createGain();
      source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(gain);
      gain.connect(dest);

      const now = audioCtx.currentTime;
      if (audioFadeInSec > 0) {
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(1, now + audioFadeInSec);
      } else {
        gain.gain.setValueAtTime(1, now);
      }
      if (audioFadeOutSec > 0) {
        const fadeOutStart = Math.max(
          now + audioFadeInSec,
          now + durationSec - audioFadeOutSec,
        );
        gain.gain.setValueAtTime(1, fadeOutStart);
        gain.gain.linearRampToValueAtTime(0.0001, now + durationSec);
      }

      for (const track of dest.stream.getAudioTracks()) {
        track.enabled = true;
        tracks.push(track);
      }
    }

    const combined = new MediaStream(tracks);
    const chunks: BlobPart[] = [];
    const recorder = createMediaRecorder(combined, mimeType);
    const resultMime = recorder.mimeType || mimeType || "video/mp4";
    const recorded = waitForRecorderBlob(
      recorder,
      chunks,
      resultMime,
      appleMobile ? 500 : 120,
    );

    drawCardFrame(ctx, bitmap, width, height);
    await wait(appleMobile ? 320 : 180);
    try {
      const trackWithFrame = videoTrack as MediaStreamTrack & { requestFrame?: () => void };
      trackWithFrame?.requestFrame?.();
    } catch {
      // ignore
    }

    // timeslice ありの方が iOS でチャンクが溜まりやすい（空対策）
    recorder.start(appleMobile ? 1000 : 250);

    if (source && audioCtx) {
      source.start(audioCtx.currentTime, 0, durationSec);
    }

    const startedAt = performance.now();
    const durationMs = durationSec * 1000;
    let lastProgressAt = 0;

    await new Promise<void>((resolve) => {
      const tick = () => {
        const elapsed = performance.now() - startedAt;
        const t = Math.min(1, elapsed / durationMs);
        if (elapsed - lastProgressAt >= 200 || t >= 1) {
          lastProgressAt = elapsed;
          onProgress?.(t);
        }

        drawCardFrame(ctx, bitmap, width, height);
        try {
          const trackWithFrame = videoTrack as MediaStreamTrack & { requestFrame?: () => void };
          trackWithFrame?.requestFrame?.();
        } catch {
          // ignore
        }

        if (elapsed >= durationMs) {
          resolve();
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    await wait(appleMobile ? 400 : 120);
    if (recorder.state === "recording") {
      try {
        recorder.requestData();
      } catch {
        // ignore
      }
    }
    if (recorder.state !== "inactive") {
      recorder.stop();
    }
    try {
      source?.stop();
    } catch {
      // already stopped
    }
    try {
      keepAliveOsc?.stop();
    } catch {
      // ignore
    }

    const blob = await recorded;
    return { blob, mimeType: resultMime, withAudio: includeAudio };
  } finally {
    try {
      keepAliveOsc?.stop();
    } catch {
      // ignore
    }
    if (audioCtx) {
      await audioCtx.close().catch(() => undefined);
    }
  }
}

/**
 * ユーザー操作（ボタン押下）の直後に呼ぶこと（AudioContext / MediaRecorder / WebCodecs 用）。
 */
export async function composeMoriLogStillMovie(
  input: ComposeMoriLogStillMovieInput,
): Promise<ComposeMoriLogStillMovieResult> {
  // iPhone Safari では MediaRecorder + 音声トラックが空になりやすいので WebCodecs を先に試す
  try {
    const { canComposeMoriLogStillMovieWithWebCodecs, composeMoriLogStillMovieWithWebCodecs } =
      await import("@/lib/journal/moriLog/composeMoriLogStillMovieWebCodecs");
    if (canComposeMoriLogStillMovieWithWebCodecs()) {
      return await composeMoriLogStillMovieWithWebCodecs(input);
    }
  } catch {
    // MediaRecorder へフォールバック
  }

  const pickedMime = pickMoriLogMovieMimeType();
  if (pickedMime == null) {
    throw new Error("この端末では動画の作成に対応していません。");
  }

  const durationSec = Math.min(15, Math.max(3, input.durationSec));
  const audioFadeInSec = Math.min(1.2, Math.max(0, input.audioFadeInSec ?? 0.35));
  const audioFadeOutSec = Math.min(1.5, Math.max(0, input.audioFadeOutSec ?? 0.6));
  const appleMobile = isLikelyAppleMobile();
  const safariLike = isLikelySafari();
  const fps = appleMobile ? 15 : 30;
  const maxEdge = appleMobile ? 720 : 1080;

  const bitmap = await loadImageBitmap(input.imageBlob);
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

  try {
    const common = {
      canvas,
      ctx,
      bitmap,
      width,
      height,
      fps,
      durationSec,
      mimeType: pickedMime,
      appleMobile,
      audioUrl: input.audioUrl,
      audioFadeInSec,
      audioFadeOutSec,
      onProgress: input.onProgress,
    };

    let pass = await recordStillPass({ ...common, includeAudio: true });
    let audioOmitted = false;

    if (!pass.blob.size && safariLike) {
      input.onProgress?.(0);
      pass = await recordStillPass({ ...common, includeAudio: false });
      audioOmitted = true;
    }

    if (!pass.blob.size) {
      throw new Error("動画データが空でした。別のブラウザか端末でお試しください。");
    }

    input.onProgress?.(1);
    return {
      blob: pass.blob,
      mimeType: pass.mimeType,
      extension: moriLogMovieExtensionForMime(pass.mimeType),
      audioOmitted: audioOmitted || undefined,
    };
  } finally {
    bitmap.close();
  }
}

export function downloadBlobFile(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

export type DownloadOrShareBlobResult = "shared" | "downloaded" | "cancelled";

/**
 * iPhone では Web Share（ファイル）を優先。キャンセルは失敗扱いしない。
 */
export async function downloadOrShareBlobFile(
  blob: Blob,
  fileName: string,
): Promise<DownloadOrShareBlobResult> {
  const type = blob.type || "application/octet-stream";
  const file = new File([blob], fileName, { type });

  const canShareFiles =
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    typeof navigator.share === "function" &&
    (() => {
      try {
        return navigator.canShare({ files: [file] });
      } catch {
        return false;
      }
    })();

  if (canShareFiles) {
    try {
      await navigator.share({ files: [file], title: fileName });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled";
      }
    }
  }

  downloadBlobFile(blob, fileName);
  return "downloaded";
}
