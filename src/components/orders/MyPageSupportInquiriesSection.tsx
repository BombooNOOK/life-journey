"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type InquirySummary = {
  id: string;
  createdAt: string;
  updatedAt: string;
  categoryLabel: string;
  statusLabel: string;
  preview: string;
};

export function MyPageSupportInquiriesSection() {
  const [inquiries, setInquiries] = useState<InquirySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/support/inquiries", { credentials: "same-origin" });
        const data = (await res.json()) as {
          error?: string;
          inquiries?: InquirySummary[];
        };
        if (!res.ok) {
          if (!cancelled) setError(data.error ?? "読み込みに失敗しました。");
          return;
        }
        if (!cancelled) setInquiries(data.inquiries ?? []);
      } catch {
        if (!cancelled) setError("読み込みに失敗しました。");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    function onCreated() {
      void load();
    }
    window.addEventListener("support-inquiry-created", onCreated);

    return () => {
      cancelled = true;
      window.removeEventListener("support-inquiry-created", onCreated);
    };
  }, []);

  return (
    <section className="space-y-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">お問い合わせ履歴</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-700">
          過去のお問い合わせと運営からの返信を確認できます。
        </p>
      </div>

      {loading ? <p className="text-sm text-stone-500">読み込み中…</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {!loading && !error && inquiries.length === 0 ? (
        <p className="text-sm text-stone-500">まだお問い合わせはありません。</p>
      ) : null}

      {!loading && inquiries.length > 0 ? (
        <ul className="space-y-2">
          {inquiries.map((inquiry) => (
            <li key={inquiry.id}>
              <Link
                href={`/orders/support/${encodeURIComponent(inquiry.id)}`}
                className="block rounded-lg border border-stone-200 bg-stone-50/60 px-3 py-3 transition hover:border-stone-300 hover:bg-stone-50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-stone-900">{inquiry.categoryLabel}</p>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-stone-600 ring-1 ring-stone-200">
                    {inquiry.statusLabel}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-600">{inquiry.preview}</p>
                <p className="mt-2 text-[11px] text-stone-400">
                  更新: {new Date(inquiry.updatedAt).toLocaleString("ja-JP")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
