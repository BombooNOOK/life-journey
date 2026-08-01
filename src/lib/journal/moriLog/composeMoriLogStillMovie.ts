/**
 * 森ログムービー MVP：静止画カード + BGM → MediaRecorder で短い動画
 * （ブラウザにより mp4 / webm。拡張子は実 MIME に合わせる）
 *
 * 先頭フレームはカード画像（サムネ・再生開始が真っ黒にならないよう、録画前に描画する）
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
  return null;
}

export function moriLogMovieExtensionForMime(mimeType: string): "mp4" | "webm" {
  return mimeType.includes("webm") ? "webm" : "mp4";
}

function isLikelyAppleMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/i.test(ua)) return true;
  // iPadOS 13+ は Macintosh UA + touch
  return /Macintosh/i.test(ua) && typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 1;
}

function createMediaRecorder(stream: MediaStream, mimeType: string): MediaRecorder {
  const attempts: MediaRecorderOptions[] = [
    { mimeType, videoBitsPerSecond: 2_500_000, audioBitsPerSecond: 128_000 },
    { mimeType, videoBitsPerSecond: 1_500_000 },
    { mimeType },
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
 * ユーザー操作（ボタン押下）の直後に呼ぶこと（AudioContext / MediaRecorder 用）。
 */
export async function composeMoriLogStillMovie(
  input: ComposeMoriLogStillMovieInput,
): Promise<ComposeMoriLogStillMovieResult> {
  const mimeType = pickMoriLogMovieMimeType();
  if (!mimeType) {
    throw new Error("この端末では動画の作成に対応していません。");
  }

  const durationSec = Math.min(15, Math.max(3, input.durationSec));
  const audioFadeInSec = Math.min(1.2, Math.max(0, input.audioFadeInSec ?? 0.35));
  const audioFadeOutSec = Math.min(1.5, Math.max(0, input.audioFadeOutSec ?? 0.6));
  const appleMobile = isLikelyAppleMobile();
  // iPhone はメモリ・エンコード負荷を抑える
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

  // 録画開始前にカードを描いておき、先頭キーフレーム／サムネをカードにする
  drawCardFrame(ctx, bitmap, width, height);

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

    const audioBuffer = await audioCtx.decodeAudioData(await fetchArrayBuffer(input.audioUrl));
    const gain = audioCtx.createGain();
    const dest = audioCtx.createMediaStreamDestination();
    const source = audioCtx.createBufferSource();
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

    const canvasStream = canvas.captureStream(fps);
    const combined = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...dest.stream.getAudioTracks(),
    ]);

    const chunks: BlobPart[] = [];
    const recorder = createMediaRecorder(combined, mimeType);
    const resultMime = recorder.mimeType || mimeType;

    const recorded = new Promise<Blob>((resolve, reject) => {
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunks.push(event.data);
      };
      recorder.onerror = () => reject(new Error("動画の録画に失敗しました。"));
      recorder.onstop = () => {
        resolve(new Blob(chunks, { type: resultMime }));
      };
    });

    // 先頭にカードが載るまで少し待ってから録画開始
    drawCardFrame(ctx, bitmap, width, height);
    await wait(appleMobile ? 280 : 180);

    // iOS は timeslice 指定で失敗・空データになりやすい
    if (appleMobile) {
      recorder.start();
    } else {
      recorder.start(250);
    }
    source.start(audioCtx.currentTime, 0, durationSec);

    const startedAt = performance.now();
    const durationMs = durationSec * 1000;
    let lastProgressAt = 0;

    await new Promise<void>((resolve) => {
      const tick = () => {
        const elapsed = performance.now() - startedAt;
        const t = Math.min(1, elapsed / durationMs);
        // 毎フレーム setState しない（iPhone の再描画負荷を抑える）
        if (elapsed - lastProgressAt >= 200 || t >= 1) {
          lastProgressAt = elapsed;
          input.onProgress?.(t);
        }

        // 映像は常にカード全面（フェードインで黒にしない）
        drawCardFrame(ctx, bitmap, width, height);

        if (elapsed >= durationMs) {
          resolve();
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    // 末尾のエンコード余白（iOS は長め）
    await wait(appleMobile ? 320 : 120);
    if (recorder.state !== "inactive") {
      try {
        // timeslice なしの場合、stop 前に残データ要求
        if (typeof recorder.requestData === "function" && recorder.state === "recording") {
          recorder.requestData();
        }
      } catch {
        // ignore
      }
      recorder.stop();
    }
    try {
      source.stop();
    } catch {
      // already stopped
    }

    const blob = await recorded;
    if (!blob.size) {
      throw new Error("動画データが空でした。別のブラウザか端末でお試しください。");
    }

    input.onProgress?.(1);
    return {
      blob,
      mimeType: resultMime,
      extension: moriLogMovieExtensionForMime(resultMime),
    };
  } finally {
    bitmap.close();
    await audioCtx.close().catch(() => undefined);
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
  // iOS の共有シートが開いている間に revoke しないよう長めに
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
      // share 非対応・失敗時はダウンロードへ
    }
  }

  downloadBlobFile(blob, fileName);
  return "downloaded";
}
