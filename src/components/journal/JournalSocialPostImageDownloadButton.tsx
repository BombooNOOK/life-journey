"use client";

import { useCallback, useRef, useState } from "react";

import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";

const IMAGE_FETCH_TIMEOUT_MS = 65_000;

type Props = {
  /** GET のとき使う URL。POST のときはエンドポイント URL */
  href: string;
  /** 指定時は POST（multipart）。3コマ追加写真など */
  buildFormData?: () => FormData;
  suggestedFileName?: string;
  label?: string;
  className?: string;
  /** 端末への保存が成功したあと（履歴記録など） */
  onDownloaded?: () => void | Promise<void>;
};

function parseFilenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;
  const quoted = /filename="([^"]+)"/i.exec(header);
  if (quoted?.[1]) return quoted[1];
  const star = /filename\*=UTF-8''([^;\s]+)/i.exec(header);
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1]);
    } catch {
      return star[1];
    }
  }
  return null;
}

function parseImageErrorMessage(status: number, contentType: string, text: string): string {
  if (status === 504 || status === 524) {
    return "画像の作成がタイムアウトしました。しばらく待ってから再試行してください。";
  }
  if (contentType.includes("application/json")) {
    try {
      const j = JSON.parse(text) as { error?: string };
      return j.error ?? "画像を取得できませんでした。";
    } catch {
      return "画像を取得できませんでした。";
    }
  }
  return "画像を取得できませんでした。";
}

export function JournalSocialPostImageDownloadButton({
  href,
  buildFormData,
  suggestedFileName,
  label = "画像を保存",
  className = "inline-flex min-h-[44px] items-center rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-90",
  onDownloaded,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);

  const runDownload = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);

    try {
      const url = new URL(href, window.location.origin);
      if (!buildFormData) {
        url.searchParams.set("_cb", String(Date.now()));
      }

      const res = await fetch(url.toString(), {
        method: buildFormData ? "POST" : "GET",
        credentials: "same-origin",
        cache: "no-store",
        signal: controller.signal,
        body: buildFormData ? buildFormData() : undefined,
      });
      const contentType = res.headers.get("Content-Type") ?? "";

      if (!res.ok) {
        const text = await res.text();
        setError(parseImageErrorMessage(res.status, contentType, text));
        return;
      }

      if (!contentType.includes("image/png")) {
        const text = await res.text();
        setError(parseImageErrorMessage(res.status, contentType, text));
        return;
      }

      const blob = await res.blob();
      if (blob.size === 0) {
        setError("画像ファイルが空でした。");
        return;
      }

      const downloadName =
        parseFilenameFromContentDisposition(res.headers.get("Content-Disposition")) ??
        suggestedFileName ??
        "mori-log-card.png";

      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = downloadName;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      await onDownloaded?.();
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        setError("画像の作成がタイムアウトしました。しばらく待ってから再試行してください。");
      } else {
        setError(e instanceof Error ? e.message : "通信に失敗しました。");
      }
    } finally {
      window.clearTimeout(timeoutId);
      busyRef.current = false;
      setBusy(false);
    }
  }, [buildFormData, href, onDownloaded, suggestedFileName]);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={busy}
        aria-busy={busy}
        onClick={() => void runDownload()}
        className={className}
      >
        {busy ? <OwlLoadingInline label="画像を作成中…" size="sm" /> : label}
      </button>
      <p className="max-w-sm text-xs leading-relaxed text-stone-600">
        {busy
          ? "画像を合成しています。完了までこの画面を閉じずにお待ちください。"
          : "タップすると保存が始まります。この画面のまま操作できます（別ページへ移りません）。"}
      </p>
      {error ? (
        <p className="text-xs font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
