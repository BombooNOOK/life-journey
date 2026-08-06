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
    // iOS は play→pause でデコードが走り、先頭コマが取れることがある
    try {
      const playPromise = video.play();
      if (playPromise) await playPromise;
      video.pause();
    } catch {
      // autoplay 制限など — seek のみで続行
    }

    await waitForEvent(video, "loadeddata", 12_000).catch(() => undefined);
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const candidates = [
      Math.min(seekSec, duration > 0 ? Math.max(0, duration * 0.02) : seekSec),
      0.25,
      0.5,
      1,
    ].filter((t, i, arr) => t >= 0 && (duration <= 0 || t < duration) && arr.indexOf(t) === i);

    for (const target of candidates) {
      try {
        if (Math.abs(video.currentTime - target) > 0.001) {
          const seeked = waitForEvent(video, "seeked", 6_000);
          video.currentTime = target;
          await seeked;
        }
        const vw = video.videoWidth || 0;
        const vh = video.videoHeight || 0;
        if (vw < 2 || vh < 2) continue;

        const scale = Math.min(1, maxWidth / vw);
        const w = Math.max(1, Math.round(vw * scale));
        const h = Math.max(1, Math.round(vh * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        ctx.drawImage(video, 0, 0, w, h);

        // 真っ黒っぽいコマは次の候補へ（簡易チェック）
        const sample = ctx.getImageData(Math.floor(w / 2), Math.floor(h / 2), 1, 1).data;
        const brightness = (sample[0] + sample[1] + sample[2]) / 3;
        if (brightness < 8) continue;

        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
        });
        if (blob && blob.size > 0) return blob;
      } catch {
        // try next seek
      }
    }
    return null;
  } catch {
    return null;
  } finally {
    try {
      video.pause();
    } catch {
      // ignore
    }
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
