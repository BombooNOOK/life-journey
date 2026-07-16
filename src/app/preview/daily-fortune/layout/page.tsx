import { notFound } from "next/navigation";

import {
  DailyFortuneLayoutDebugClient,
  DailyFortuneLayoutDebugLinks,
} from "./DailyFortuneLayoutDebugClient";

export default function DailyFortuneLayoutPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-[1200px] px-4 py-10">
        <p className="text-xs font-medium uppercase tracking-wide text-amber-800">Dev layout tool</p>
        <h1 className="mt-2 text-xl font-semibold">今日の鑑定結果レイアウト定規</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          背景カードの枠に合わせて、ひとこと・お守りカラー・小さな行動などの位置を調整できます。終わったら
          「この配置をファイルに保存」を押してください（コピペ不要）。
        </p>

        <div className="mt-8">
          <DailyFortuneLayoutDebugClient />
        </div>

        <DailyFortuneLayoutDebugLinks />
      </div>
    </div>
  );
}
