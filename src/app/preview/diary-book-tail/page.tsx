import type { Metadata } from "next";
import { Suspense } from "react";

import { DiaryBookTailPreviewClient } from "@/app/preview/diary-book-tail/DiaryBookTailPreviewClient";

export const metadata: Metadata = {
  title: "日記ブック末尾ページ確認",
  robots: { index: false, follow: false },
};

export default function DiaryBookTailPreviewPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-stone-500">読み込み中…</p>}>
      <DiaryBookTailPreviewClient />
    </Suspense>
  );
}
