"use client";

import { useMemo, useState } from "react";

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
  const targetHref = useMemo(() => href, [href]);

  return (
    <div className="space-y-2">
      <button
        type="button"
        className={className}
        disabled={loading}
        onClick={() => {
          setLoading(true);
          window.open(targetHref, "_blank", "noopener,noreferrer");
          window.setTimeout(() => {
            setLoading(false);
          }, 12000);
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
    </div>
  );
}
