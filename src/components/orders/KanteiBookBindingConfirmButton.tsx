"use client";

import { useState } from "react";

import { BASE_KANTEI_BOOK_URL } from "@/lib/commerce/baseUrls";
import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";

function openBaseShop(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function KanteiBookBindingConfirmButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/kantei-book-binding`, {
        method: "POST",
        credentials: "same-origin",
      });
      const data = (await res.json()) as { error?: string; baseShopUrl?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "申込記録の作成に失敗しました。");
      }
      openBaseShop(data.baseShopUrl ?? BASE_KANTEI_BOOK_URL);
    } catch (e) {
      setError(e instanceof Error ? e.message : "申込記録の作成に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void handleConfirm()}
        disabled={loading}
        className="inline-flex rounded-lg border border-violet-300 bg-violet-50 px-5 py-2.5 text-sm font-medium text-violet-950 hover:bg-violet-100 disabled:opacity-60"
      >
        {loading ? (
          <OwlLoadingInline label="記録中…" size="sm" />
        ) : (
          "製本版を注文する"
        )}
      </button>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
