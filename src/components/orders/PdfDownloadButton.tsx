"use client";

import { useEffect, useState } from "react";

type Props = {
  href: string;
  label: string;
  className: string;
  /** ボタン下の補足（初回は時間がかかる旨など） */
  loadingLabel?: string;
  /** 保存時のファイル名の目安（同一オリジンなら `download` に反映されます） */
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

  useEffect(() => {
    const u = new URL(href, window.location.origin);
    u.searchParams.set("_cb", String(Date.now()));
    setHrefWithCacheBust(`${u.pathname}${u.search}`);
  }, [href]);

  return (
    <div className="space-y-2">
      <a
        href={hrefWithCacheBust}
        className={className}
        download={suggestedFileName}
        rel="noopener noreferrer"
      >
        {label}
      </a>
      {loadingLabel ? (
        <p className="flex items-start gap-2 text-xs leading-relaxed text-stone-500">
          <span className="inline-block shrink-0 animate-spin" aria-hidden>
            🦉
          </span>
          <span>{loadingLabel}</span>
        </p>
      ) : null}
    </div>
  );
}
