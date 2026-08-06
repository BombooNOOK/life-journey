import Link from "next/link";
import { notFound } from "next/navigation";

import { JournalLocalDraftPreviewClient } from "./JournalLocalDraftPreviewClient";

export default function JournalLocalDraftPreviewPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">Dev preview</p>
        <h1 className="mt-2 text-xl font-semibold text-stone-900">
          あしあとオフライン下書き（Cursor Simple Browser 用）
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          ログイン不要でバナー UI を確認できます。実際の autosave は{" "}
          <code className="rounded bg-stone-200 px-1">/journal</code> で行います。
        </p>
        <p className="mt-3">
          <Link href="/preview" className="text-sm text-stone-600 underline-offset-2 hover:underline">
            ← プレビュー一覧
          </Link>
        </p>

        <div className="mt-8">
          <JournalLocalDraftPreviewClient />
        </div>
      </div>
    </div>
  );
}
