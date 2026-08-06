/**
 * iPhone などでは <video> 未再生時に真っ黒になりやすいため、
 * 先頭付近の1コマを JPEG ポスターとして取り出す。
 */

export type CaptureVideoPosterFrameOptions = {
  /** seek 先（秒）。先頭が黒の端末向けにわずかに進める */
  seekSec?: number;
  /** JPEG quality 0–1 */
  quality?: number;
  /** 最大幅（縦長でも比率維持） */
  maxWidth?: number;
};

function waitForEvent(
  target: EventTarget,
  type: string,
  timeoutMs: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = window.setTimeout(() => {
      cleanup();
      reject(new Error(`timeout:${type}`));
    }, timeoutMs);
    const onOk = () => {
      cleanup();
      resolve();
    };
    const onErr = () => {
      cleanup();
      reject(new Error(`error:${type}`));
    };
    const cleanup = () => {
      window.clearTimeout(t);
      target.removeEventListener(type, onOk);
      target.removeEventListener("error", onErr);
    };
    target.addEventListener(type, onOk, { once: true });
    target.addEventListener("error", onErr, { once: true });
  });
}

/**
 * videoSrc からポスター JPEG Blob を返す。失敗時は null。
 */
export async function captureVideoPosterFrameBlob(
  videoSrc: string,
  options?: CaptureVideoPosterFrameOptions,
): Promise<Blob | null> {
  if (typeof document === "undefined") return null;
  const seekSec = Math.max(0, options?.seekSec ?? 0.12);
  const quality = options?.quality ?? 0.82;
  const maxWidth = options?.maxWidth ?? 720;

  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.preload = "auto";
  video.src = videoSrc;

  try {
    await waitForEvent(video, "loadeddata", 12_000);
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const target =
      duration > 0 ? Math.min(seekSec, Math.max(0, duration * 0.02)) : seekSec;

    if (video.currentTime !== target) {
      const seeked = waitForEvent(video, "seeked", 8_000);
      video.currentTime = target;
      await seeked;
    }

    const vw = video.videoWidth || 0;
    const vh = video.videoHeight || 0;
    if (vw < 2 || vh < 2) return null;

    const scale = Math.min(1, maxWidth / vw);
    const w = Math.max(1, Math.round(vw * scale));
    const h = Math.max(1, Math.round(vh * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, w, h);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
    });
    return blob && blob.size > 0 ? blob : null;
  } catch {
    return null;
  } finally {
    video.removeAttribute("src");
    video.load();
  }
}

export async function captureVideoPosterObjectUrl(
  videoSrc: string,
  options?: CaptureVideoPosterFrameOptions,
): Promise<string | null> {
  const blob = await captureVideoPosterFrameBlob(videoSrc, options);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}
