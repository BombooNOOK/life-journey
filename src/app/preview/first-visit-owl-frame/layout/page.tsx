import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  FirstVisitOwlFrameLayoutDebugClient,
  FirstVisitOwlFrameLayoutDebugLinks,
} from "./FirstVisitOwlFrameLayoutDebugClient";

export default function FirstVisitOwlFrameLayoutPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-[1100px] px-4 py-10">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">Dev layout tool</p>
        <h1 className="mt-2 text-xl font-semibold">フクロウ先生コメント枠レイアウト定規</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          枠 PNG（480×480）上のテキスト座標を測ります。{" "}
          <code className="rounded bg-stone-200 px-1">?preset=loghouse-sign</code> または{" "}
          <code className="rounded bg-stone-200 px-1">?preset=resident-owl</code> で切り替え。
        </p>

        <div className="mt-8">
          <Suspense fallback={<p className="text-sm text-stone-500">定規を読み込んでいます…</p>}>
            <FirstVisitOwlFrameLayoutDebugClient />
          </Suspense>
        </div>

        <FirstVisitOwlFrameLayoutDebugLinks />
      </div>
    </div>
  );
}
