import type { Metadata } from "next";

import { AshiatoTemplatesRenderPreviewClient } from "./AshiatoTemplatesRenderPreviewClient";
import { assertDevOrAdminPreviewAccess } from "@/lib/preview/assertDevOrAdminPreviewAccess";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "プレビュー：あしあとページのかたち 実描画",
};

/** あしあと本文：選択テンプレでの実描画確認（サンプルデータ） */
export default async function AshiatoTemplatesRenderPreviewPage() {
  await assertDevOrAdminPreviewAccess();

  return (
    <div className="min-h-screen bg-[#f7f4ef] text-stone-900">
      <header className="border-b border-stone-200 bg-[#faf8f5] px-4 py-4 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-wide text-amber-800">Preview</p>
        <h1 className="mt-1 text-lg font-semibold sm:text-xl">
          あしあとブック：ページのかたち（実描画）
        </h1>
        <p className="mt-1 text-xs leading-relaxed text-stone-600 sm:text-sm">
          読書画面と同じコンポーネントで、写真・日付・本文・すうじ・読み解きの重なりを確認できます。
        </p>
      </header>
      <div className="px-4 py-6 sm:px-6">
        <AshiatoTemplatesRenderPreviewClient />
      </div>
    </div>
  );
}
