/**
 * 森ログムービー MVP：静止画カード + BGM → MediaRecorder で短い動画
 * （ブラウザにより mp4 / webm。拡張子は実 MIME に合わせる）
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

export type ComposeMoriLogStillMovieInput = {
  imageBlob: Blob;
  /** /audio/... など */
  audioUrl: string;
  durationSec: number;
  fadeSec?: number;
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

  const durationSec = Math.min(12, Math.max(3, input.durationSec));
  const fadeSec = Math.min(1.2, Math.max(0, input.fadeSec ?? 0.45));
  const fps = 30;

  const bitmap = await loadImageBitmap(input.imageBlob);
  const maxEdge = 1080;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(2, Math.round(bitmap.width * scale) & ~1);
  const height = Math.max(2, Math.round(bitmap.height * scale) & ~1);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
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

    const audioBuffer = await audioCtx.decodeAudioData(await fetchArrayBuffer(input.audioUrl));
    const gain = audioCtx.createGain();
    const dest = audioCtx.createMediaStreamDestination();
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(gain);
    gain.connect(dest);

    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0, now);
    if (fadeSec > 0) {
      gain.gain.linearRampToValueAtTime(1, now + fadeSec);
      const fadeOutStart = Math.max(now + fadeSec, now + durationSec - fadeSec);
      gain.gain.setValueAtTime(1, fadeOutStart);
      gain.gain.linearRampToValueAtTime(0.0001, now + durationSec);
    } else {
      gain.gain.setValueAtTime(1, now);
    }

    const canvasStream = canvas.captureStream(fps);
    const combined = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...dest.stream.getAudioTracks(),
    ]);

    const chunks: BlobPart[] = [];
    const recorder = new MediaRecorder(combined, {
      mimeType,
      videoBitsPerSecond: 2_500_000,
      audioBitsPerSecond: 128_000,
    });

    const recorded = new Promise<Blob>((resolve, reject) => {
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunks.push(event.data);
      };
      recorder.onerror = () => reject(new Error("動画の録画に失敗しました。"));
      recorder.onstop = () => {
        resolve(new Blob(chunks, { type: mimeType }));
      };
    });

    recorder.start(250);
    source.start(now, 0, durationSec);

    const startedAt = performance.now();
    const durationMs = durationSec * 1000;

    await new Promise<void>((resolve) => {
      const tick = () => {
        const elapsed = performance.now() - startedAt;
        const t = Math.min(1, elapsed / durationMs);
        input.onProgress?.(t);

        let alpha = 1;
        if (fadeSec > 0) {
          const elapsedSec = elapsed / 1000;
          if (elapsedSec < fadeSec) alpha = elapsedSec / fadeSec;
          else if (elapsedSec > durationSec - fadeSec) {
            alpha = Math.max(0, (durationSec - elapsedSec) / fadeSec);
          }
        }

        ctx.fillStyle = "#111111";
        ctx.fillRect(0, 0, width, height);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.drawImage(bitmap, 0, 0, width, height);
        ctx.restore();

        if (elapsed >= durationMs) {
          resolve();
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    // 末尾のエンコード余白
    await wait(120);
    if (recorder.state !== "inactive") recorder.stop();
    try {
      source.stop();
    } catch {
      // already stopped
    }

    const blob = await recorded;
    if (!blob.size) {
      throw new Error("動画データが空でした。");
    }

    input.onProgress?.(1);
    return {
      blob,
      mimeType,
      extension: moriLogMovieExtensionForMime(mimeType),
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
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 2_000);
}
