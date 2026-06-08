"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  inquiryId: string;
  currentStatus: string;
};

export function SupportInquiryResolveButton({ inquiryId, currentStatus }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (currentStatus === "resolved") {
    return <span className="text-xs text-emerald-700">対応済み</span>;
  }

  async function markResolved() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/support-inquiries/${encodeURIComponent(inquiryId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ status: "resolved" }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "更新に失敗しました。");
        return;
      }
      router.refresh();
    } catch {
      setError("更新に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={busy}
        onClick={() => void markResolved()}
        className="rounded-md border border-stone-300 bg-white px-2 py-1 text-xs text-stone-800 hover:bg-stone-50 disabled:opacity-60"
      >
        {busy ? "更新中…" : "対応済みにする"}
      </button>
      {error ? <p className="text-[11px] text-red-700">{error}</p> : null}
    </div>
  );
}
