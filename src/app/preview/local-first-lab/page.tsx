import { notFound } from "next/navigation";

import { LocalFirstMigrationLabClient } from "@/components/local-first/LocalFirstMigrationLabClient";

/**
 * Phase 4B-2C PoC surface — not public marketing UI.
 * Available in development so Simulator remote-shell can use cookie auth APIs.
 */
export default function LocalFirstLabPreviewPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#f7f3ea] px-4 py-8 text-stone-900">
      <div className="mx-auto max-w-lg space-y-4">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-900">
          Local-first confirmation
        </p>
        <h1 className="text-xl font-semibold">端末へあしあと控えを残す（確認用）</h1>
        <p className="text-sm leading-relaxed text-stone-600">
          ログインした状態で、移行確認用にあしあと1件の ID を指定してください。正式な公開メニューではありません。
        </p>
        <LocalFirstMigrationLabClient />
      </div>
    </div>
  );
}
