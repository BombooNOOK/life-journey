"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { LOG_HOUSE_LOAD_ERROR_TITLE, LOG_HOUSE_PAGE_TITLE } from "@/lib/journal/logHouseLabels";

type Props = {
  detail: string;
};

/** /orders の DB 一時エラー時：再読み込みを促す */
export function LogHouseLoadErrorPanel({ detail }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = () => {
    setRetryCount((n) => n + 1);
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">{LOG_HOUSE_PAGE_TITLE}</h1>
      </div>
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
        <p className="font-semibold">{LOG_HOUSE_LOAD_ERROR_TITLE}</p>
        <p className="mt-2 text-stone-800">
          データベースへの接続が一時的に切れている可能性があります。少し待ってから、下の「もう一度読み込む」を押してください。
        </p>
        <button
          type="button"
          onClick={handleRetry}
          disabled={isPending}
          className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-emerald-900/15 bg-emerald-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-900 disabled:opacity-60"
        >
          {isPending ? "読み込み中…" : "もう一度読み込む"}
        </button>
        {retryCount > 0 ? (
          <p className="mt-2 text-xs text-stone-600">再試行 {retryCount} 回目</p>
        ) : null}
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-red-800">詳細</p>
        <p className="mt-1 whitespace-pre-wrap rounded-md border border-red-200/80 bg-white/80 px-3 py-2 font-mono text-xs text-red-950">
          {detail}
        </p>
      </div>
    </div>
  );
}
