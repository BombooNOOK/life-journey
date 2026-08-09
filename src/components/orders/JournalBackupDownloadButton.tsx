"use client";

import { useCallback, useRef, useState } from "react";

import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";
import { OwlSpinIndicator } from "@/components/ui/OwlSpinIndicator";

const BACKUP_FETCH_TIMEOUT_MS = 310_000;

type Props = {
  href?: string;
  suggestedFileName?: string;
};

function parseBackupErrorMessage(status: number, contentType: string, text: string): string {
  if (status === 504 || status === 524) {
    return "バックアップの作成がタイムアウトしました。しばらく待ってから再試行してください。";
  }
  if (status === 502 || status === 503) {
    return "サーバーが一時的に応答できませんでした。しばらく待ってから再試行してください。";
  }
  if (contentType.includes("application/json")) {
    try {
      const j = JSON.parse(text) as { error?: string; message?: string };
      return j.error ?? j.message ?? "バックアップを取得できませんでした。";
    } catch {
      return "バックアップを取得できませんでした。";
    }
  }
  return "バックアップを取得できませんでした。";
}

function isZipContentType(contentType: string): boolean {
  const ct = contentType.toLowerCase();
  return ct.includes("application/zip") || ct.includes("application/octet-stream");
}

function parseFilenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;
  const match = /filename="([^"]+)"/i.exec(header);
  return match?.[1] ?? null;
}

export function JournalBackupDownloadButton({
  href = "/api/journal/backup",
  suggestedFileName,
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
    const timeoutId = window.setTimeout(() => controller.abort(), BACKUP_FETCH_TIMEOUT_MS);

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
        setError(parseBackupErrorMessage(res.status, contentType, text));
        return;
      }

      if (!isZipContentType(contentType)) {
        const text = await res.text();
        setError(parseBackupErrorMessage(res.status, contentType, text));
        return;
      }

      const blob = await res.blob();
      if (blob.size === 0) {
        setError("バックアップファイルが空でした。作成に失敗した可能性があります。");
        return;
      }

      const downloadName =
        parseFilenameFromContentDisposition(res.headers.get("Content-Disposition")) ??
        suggestedFileName ??
        "life-journey-diary-backup.zip";

      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = downloadName;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        setError(
          "バックアップの作成がタイムアウトしました（約5分）。写真が多い場合は時間がかかることがあります。しばらく待ってから再試行してください。",
        );
      } else {
        setError(e instanceof Error ? e.message : "通信に失敗しました。");
      }
    } finally {
      window.clearTimeout(timeoutId);
      busyRef.current = false;
      setBusy(false);
    }
  }, [href, suggestedFileName]);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={busy}
        aria-busy={busy}
        onClick={() => void runDownload()}
        className={[
          "inline-flex min-h-[44px] items-center rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-950 transition hover:bg-emerald-100",
          busy ? "cursor-wait opacity-90" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {busy ? (
          <OwlLoadingInline label="バックアップを作成しています…" size="sm" className="w-full" />
        ) : (
          "バックアップを作成する"
        )}
      </button>
      {busy ? (
        <p className="flex items-start gap-2 text-sm leading-relaxed text-stone-800" role="status" aria-live="polite">
          <OwlSpinIndicator size="md" />
          <span>あしあとと写真をZIPにまとめています。完了まで画面を閉じずにお待ちください。</span>
        </p>
      ) : (
        <p className="text-xs leading-relaxed text-stone-500">
          タップするとダウンロードが始まります。写真が多い場合は数分かかることがあります。
        </p>
      )}
      {error ? (
        <p className="text-xs font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
