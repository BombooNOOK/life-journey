import { notFound } from "next/navigation";

import {
  ForestBookshelfLayoutDebugClient,
  ForestBookshelfLayoutDebugLinks,
} from "./ForestBookshelfLayoutDebugClient";

export default function ForestBookshelfLayoutPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-[1200px] px-4 py-10">
        <p className="text-xs font-medium uppercase tracking-wide text-amber-800">Dev layout tool</p>
        <h1 className="mt-2 text-xl font-semibold">森の本棚レイアウト定規</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          合わせ先はアップ構図の空棚です。緑の棚板ラインに本の下端を合わせ、終わったら
          「この配置をファイルに保存」を押してください（コピペ不要）。
        </p>

        <div className="mt-8">
          <ForestBookshelfLayoutDebugClient />
        </div>

        <ForestBookshelfLayoutDebugLinks />
      </div>
    </div>
  );
}
