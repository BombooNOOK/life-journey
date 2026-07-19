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
    <div className="fixed inset-0 z-0 flex flex-col bg-stone-50 text-stone-900">
      <header className="shrink-0 border-b border-stone-200 bg-stone-50 px-3 py-3 sm:px-4">
        <p className="text-xs font-medium uppercase tracking-wide text-amber-800">Dev layout tool</p>
        <h1 className="mt-1 text-lg font-semibold sm:text-xl">森の本棚レイアウト定規</h1>
        <p className="mt-1 text-xs leading-relaxed text-stone-600 sm:text-sm">
          下の枠内を上下にスクロールできます。定規は既定 55%。緑の棚板ラインに本の下端を合わせ、「この配置をファイルに保存」で完了です。
        </p>
      </header>

      <div
        className="min-h-0 flex-1 overflow-y-scroll overscroll-contain px-3 py-4 sm:px-4"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="mx-auto max-w-[920px] pb-16">
          <ForestBookshelfLayoutDebugClient />
          <ForestBookshelfLayoutDebugLinks />
        </div>
      </div>
    </div>
  );
}
