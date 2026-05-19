import Link from "next/link";

import { PdfQuickPreviewClient } from "./PdfQuickPreviewClient";

export default function PdfQuickPreviewPage() {
  if (process.env.NODE_ENV !== "development") {
    return (
      <div className="min-h-screen bg-stone-50 px-4 py-10 text-stone-800">
        <div className="mx-auto max-w-lg rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold">PDF サク見</h1>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            このプレビューは <code className="rounded bg-stone-100 px-1">npm run dev</code>{" "}
            の開発モードでのみ利用できます。
          </p>
          <p className="mt-4">
            <Link href="/preview" className="text-sm text-stone-700 underline hover:text-stone-900">
              ← 校正メニューへ
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return <PdfQuickPreviewClient />;
}
