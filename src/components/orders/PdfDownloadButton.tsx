"use client";

import { useState } from "react";

type Props = {
  href: string;
  label: string;
  className: string;
  loadingLabel?: string;
};

export function PdfDownloadButton({
  href,
  label,
  className,
  loadingLabel = "鑑定書を準備中です…（30〜60秒）",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** ブラウザ／CDN の古いレスポンスを避ける（毎回別 URL + fetch はキャッシュしない） */
  const pdfUrlWithCacheBust = (baseHref: string): string => {
    const u = new URL(baseHref, window.location.origin);
    u.searchParams.set("_cb", String(Date.now()));
    return u.toString();
  };

  const parseFilename = (contentDisposition: string | null): string => {
    if (!contentDisposition) return "kantei.pdf";
    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
    const basicMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
    if (basicMatch?.[1]) return basicMatch[1];
    return "kantei.pdf";
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        className={className}
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          setError(null);
          const fetchUrl = pdfUrlWithCacheBust(href);
          try {
            const res = await fetch(fetchUrl, {
              method: "GET",
              credentials: "same-origin",
              cache: "no-store",
            });
            const contentType = res.headers.get("content-type") ?? "";
            if (!res.ok) {
              if (contentType.includes("text/html")) {
                window.location.href = fetchUrl;
                return;
              }
              throw new Error(`HTTP ${res.status}`);
            }
            if (!contentType.includes("application/pdf")) {
              window.location.href = fetchUrl;
              return;
            }
            const blob = await res.blob();
            const downloadUrl = URL.createObjectURL(blob);
            const filename = parseFilename(res.headers.get("content-disposition"));
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = filename;
            a.rel = "noreferrer";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
          } catch {
            setError("通信状況により生成に失敗しました。もう一度お試しください。");
            // Fallback to server route in case the browser blocked blob download.
            window.location.href = fetchUrl;
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? "フクロウ先生が準備中…" : label}
      </button>
      {loading ? (
        <p className="flex items-center gap-2 text-xs text-stone-500">
          <span className="inline-block animate-spin">🦉</span>
          {loadingLabel}
        </p>
      ) : null}
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
