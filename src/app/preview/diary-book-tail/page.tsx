import type { Metadata } from "next";
import { Suspense } from "react";

import { DiaryBookTailPreviewClient } from "@/app/preview/diary-book-tail/DiaryBookTailPreviewClient";
import { OwlSuspenseFallback } from "@/components/ui/OwlSuspenseFallback";

export const metadata: Metadata = {
  title: "日記ブック末尾ページ確認",
  robots: { index: false, follow: false },
};

export default function DiaryBookTailPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8">
          <OwlSuspenseFallback label="読み込んでいます…" />
        </div>
      }
    >
      <DiaryBookTailPreviewClient />
    </Suspense>
  );
}
