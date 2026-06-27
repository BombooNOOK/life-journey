"use client";

import { useCallback, useRef, useState } from "react";

import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";

const ZIP_FETCH_TIMEOUT_MS = 130_000;

type Props = {
  href: string;
  suggestedFileName?: string;
  label?: string;
  disabled?: boolean;
  disabledTitle?: string;
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

function parseZipErrorMessage(status: number, contentType: string, text: string): string {
  if (status === 504 || status === 524) {
    return "ZIPの作成がタイムアウトしました。しばらく待ってから再試行してください。";
  }
  if (contentType.includes("application/json")) {
    try {
      const j = JSON.parse(text) as { error?: string };
      return j.error ?? "ZIPを取得できませんでした。";
    } catch {
      return "ZIPを取得できませんでした。";
    }
  }
  return "ZIPを取得できませんでした。";
}

export function DailyNumberZipDownloadButton({
  href,
  suggestedFileName,
  label = "ZIPダウンロード（画像9枚＋キャプション）",
  disabled = false,
  disabledTitle,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);

  const runDownload = useCallback(async () => {
    if (disabled || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), ZIP_FETCH_TIMEOUT_MS);

    try {
      const url = new URL(href, window.location.origin);
      url.searchParams.set("_cb", String(Date.now()));

      const res = await fetch(url.toString(), {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        signal: controller.signal,
      });
      const contentType = res.headers.get("Content-Type") ?? "";

      if (!res.ok) {
        const text = await res.text();
        setError(parseZipErrorMessage(res.status, contentType, text));
        return;
      }

      const blob = await res.blob();
      if (blob.size === 0) {
        setError("ZIPファイルが空でした。");
        return;
      }

      const downloadName =
        parseFilenameFromContentDisposition(res.headers.get("Content-Disposition")) ??
        suggestedFileName ??
        "kokoro-yoho.zip";

      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = downloadName;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        setError("ZIPの作成がタイムアウトしました。しばらく待ってから再試行してください。");
      } else {
        setError(e instanceof Error ? e.message : "通信に失敗しました。");
      }
    } finally {
      window.clearTimeout(timeoutId);
      busyRef.current = false;
      setBusy(false);
    }
  }, [disabled, href, suggestedFileName]);

  if (disabled) {
    return (
      <span
        className="inline-flex cursor-not-allowed rounded-md bg-stone-300 px-4 py-2 text-sm font-medium text-stone-600"
        title={disabledTitle}
      >
        {label}
      </span>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={busy}
        aria-busy={busy}
        onClick={() => void runDownload()}
        className={[
          "inline-flex min-h-[44px] items-center rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600",
          busy ? "cursor-wait opacity-90" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {busy ? <OwlLoadingInline label="ZIPを作成中…" size="sm" /> : label}
      </button>
      <p className="max-w-sm text-xs leading-relaxed text-stone-600">
        {busy
          ? "画像を合成しています。完了までこの画面を閉じずにお待ちください。"
          : "タップするとダウンロードが始まります。この編集画面のまま操作できます（別ページへ移りません）。"}
      </p>
      {error ? (
        <p className="text-xs font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
