import { Suspense } from "react";
import { notFound } from "next/navigation";

import { LocalStorageDiagnosticsClient } from "@/components/local-first/LocalStorageDiagnosticsClient";

/**
 * Developer-only Local Storage Diagnostics (Phase 4B-2D).
 * Not a product surface. Production → 404.
 */
export default function LocalStorageDiagnosticsPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#f4f6f3] px-4 py-8 text-stone-900">
      <div className="mx-auto max-w-lg space-y-4">
        <p className="text-xs font-medium tracking-wide text-stone-500">
          Developer tool · Local-first foundation
        </p>
        <h1 className="text-xl font-semibold">開発者用 Local Storage Diagnostics</h1>
        <p className="text-sm leading-relaxed text-stone-600">
          SQLite / Filesystem / 1件コピー / Security PoC（dummy）の確認用です。一般メニューには置かず、個人データの閲覧を前提にしません。secret全文は表示しません。
        </p>
        <Suspense fallback={<p className="text-sm text-stone-500">読み込み中…</p>}>
          <LocalStorageDiagnosticsClient />
        </Suspense>
      </div>
    </div>
  );
}
