"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";
import { OwlSpinIndicator } from "@/components/ui/OwlSpinIndicator";

/** API `maxDuration`（300秒）より少し長めに待ってから打ち切る */
const PDF_FETCH_TIMEOUT_MS = 310_000;

type Props = {
  href: string;
  label: string;
  className: string;
  /** ダウンロード処理中に回転フクロウの横に出す案内 */
  loadingLabel?: string;
  /** 保存時のファイル名の目安 */
  suggestedFileName?: string;
};

function parsePdfErrorMessage(status: number, contentType: string, text: string): string {
  if (status === 429) {
    return "ダウンロード回数の上限に達しています。時間をおいて再度お試しのうえ、必要なら再発行の案内をご確認ください。";
  }
  if (status === 504 || status === 524) {
    return "PDFの生成がタイムアウトしました。しばらく待ってから再試行してください。";
  }
  if (status === 502 || status === 503) {
    return "サーバーが一時的に応答できませんでした。しばらく待ってから再試行してください。";
  }
  if (contentType.includes("application/json")) {
    try {
      const j = JSON.parse(text) as { error?: string; message?: string };
      return j.error ?? j.message ?? "PDFを取得できませんでした。";
    } catch {
      return "PDFを取得できませんでした。";
    }
  }
  return "PDFを取得できませんでした。";
}

function isPdfContentType(contentType: string): boolean {
  const ct = contentType.toLowerCase();
  return ct.includes("application/pdf") || ct.includes("application/octet-stream");
}

export function PdfDownloadButton({
  href,
  label,
  className,
  loadingLabel = "鑑定書を準備中です…（30〜60秒）",
  suggestedFileName,
}: Props) {
  const [hrefWithCacheBust, setHrefWithCacheBust] = useState(href);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    const u = new URL(href, window.location.origin);
    u.searchParams.set("_cb", String(Date.now()));
    setHrefWithCacheBust(`${u.pathname}${u.search}`);
  }, [href]);

  const runDownload = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), PDF_FETCH_TIMEOUT_MS);

    try {
      const res = await fetch(hrefWithCacheBust, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        signal: controller.signal,
      });
      const contentType = res.headers.get("Content-Type") ?? "";

      if (!res.ok) {
        const text = await res.text();
        setError(parsePdfErrorMessage(res.status, contentType, text));
        return;
      }

      if (!isPdfContentType(contentType)) {
        const text = await res.text();
        setError(parsePdfErrorMessage(res.status, contentType, text));
        return;
      }

      const blob = await res.blob();
      if (blob.size === 0) {
        setError("PDFが空でした。生成に失敗した可能性があります。");
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = suggestedFileName ?? "document.pdf";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        setError(
          "PDFの準備がタイムアウトしました（約5分）。生成に時間がかかっているか、サーバー側でエラーが発生した可能性があります。しばらく待ってから再試行してください。",
        );
      } else {
        setError(e instanceof Error ? e.message : "通信に失敗しました。");
      }
    } finally {
      window.clearTimeout(timeoutId);
      busyRef.current = false;
      setBusy(false);
    }
  }, [hrefWithCacheBust, suggestedFileName]);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={busy}
        aria-busy={busy}
        onClick={() => void runDownload()}
        className={[className, busy ? "cursor-wait opacity-90" : ""].filter(Boolean).join(" ")}
      >
        {busy ? (
          <OwlLoadingInline label="PDFを準備しています…" size="sm" className="w-full" />
        ) : (
          label
        )}
      </button>
      {busy ? (
        <p className="flex items-start gap-2 text-sm leading-relaxed text-stone-800" role="status" aria-live="polite">
          <OwlSpinIndicator size="md" />
          <span>{loadingLabel}</span>
        </p>
      ) : (
        <p className="text-xs leading-relaxed text-stone-500">
          タップするとダウンロードが始まります。フクロウが回っているあいだは画面を閉じずにお待ちください（完了すると保存ダイアログが開きます）。
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
