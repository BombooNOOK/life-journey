"use client";

import { useCallback, useEffect, useState } from "react";

type Props = {
  href: string;
  label: string;
  className: string;
  /** ダウンロード処理中に回転フクロウの横に出す案内 */
  loadingLabel?: string;
  /** 保存時のファイル名の目安 */
  suggestedFileName?: string;
};

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

  useEffect(() => {
    const u = new URL(href, window.location.origin);
    u.searchParams.set("_cb", String(Date.now()));
    setHrefWithCacheBust(`${u.pathname}${u.search}`);
  }, [href]);

  const runDownload = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(hrefWithCacheBust, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });
      const contentType = res.headers.get("Content-Type") ?? "";
      if (!res.ok) {
        const text = await res.text();
        if (res.status === 429) {
          setError(
            "ダウンロード回数の上限に達しています。時間をおいて再度お試しのうえ、必要なら再発行の案内をご確認ください。",
          );
          return;
        }
        if (contentType.includes("application/json")) {
          try {
            const j = JSON.parse(text) as { error?: string; message?: string };
            setError(j.error ?? j.message ?? "PDFを取得できませんでした。");
          } catch {
            setError("PDFを取得できませんでした。");
          }
          return;
        }
        setError("PDFを取得できませんでした。");
        return;
      }
      const blob = await res.blob();
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
      setError(e instanceof Error ? e.message : "通信に失敗しました。");
    } finally {
      setBusy(false);
    }
  }, [busy, hrefWithCacheBust, suggestedFileName]);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => void runDownload()}
        className={[className, busy ? "cursor-wait opacity-90" : ""].filter(Boolean).join(" ")}
      >
        {busy ? "鑑定書を準備中…" : label}
      </button>
      {busy ? (
        <p className="flex items-start gap-2 text-sm leading-relaxed text-stone-800" role="status" aria-live="polite">
          <span className="inline-block shrink-0 origin-center animate-spin text-lg leading-none" aria-hidden>
            🦉
          </span>
          <span>{loadingLabel}</span>
        </p>
      ) : (
        <p className="flex items-start gap-2 text-xs leading-relaxed text-stone-500">
          <span className="inline-block shrink-0 text-base leading-none" aria-hidden>
            🦉
          </span>
          <span>
            タップするとダウンロードが始まります。フクロウが回っているあいだは画面を閉じずにお待ちください（完了すると保存ダイアログが開きます）。
          </span>
        </p>
      )}
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
