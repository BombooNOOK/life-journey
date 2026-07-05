import type { Metadata } from "next";
import { Suspense } from "react";

import { DiaryBookEntryPreviewClient } from "@/app/preview/diary-book-entry/DiaryBookEntryPreviewClient";
import { OwlSuspenseFallback } from "@/components/ui/OwlSuspenseFallback";

export const metadata: Metadata = {
  title: "日記ブック本文テンプレ確認",
  robots: { index: false, follow: false },
};

export default function DiaryBookEntryPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8">
          <OwlSuspenseFallback label="読み込んでいます…" />
        </div>
      }
    >
      <DiaryBookEntryPreviewClient />
    </Suspense>
  );
}
