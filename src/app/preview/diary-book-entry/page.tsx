import type { Metadata } from "next";
import { Suspense } from "react";

import { DiaryBookEntryPreviewClient } from "@/app/preview/diary-book-entry/DiaryBookEntryPreviewClient";

export const metadata: Metadata = {
  title: "日記ブック本文テンプレ確認",
  robots: { index: false, follow: false },
};

export default function DiaryBookEntryPreviewPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-stone-500">読み込み中…</p>}>
      <DiaryBookEntryPreviewClient />
    </Suspense>
  );
}
