import type { Metadata } from "next";

import { AshiatoTemplatesPreviewClient } from "./AshiatoTemplatesPreviewClient";
import { assertDevOrAdminPreviewAccess } from "@/lib/preview/assertDevOrAdminPreviewAccess";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "プレビュー：あしあとブック表紙・ページのかたち",
};

/** あしあとブック：表紙3種＋ページのかたち4種の確認用 */
export default async function AshiatoTemplatesPreviewPage() {
  await assertDevOrAdminPreviewAccess();

  return (
    <div className="min-h-screen bg-[#f7f4ef] text-stone-900">
      <header className="border-b border-stone-200 bg-[#faf8f5] px-4 py-4 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-wide text-amber-800">Preview</p>
        <h1 className="mt-1 text-lg font-semibold sm:text-xl">
          あしあとブック：表紙・ページのかたち
        </h1>
        <p className="mt-1 text-xs leading-relaxed text-stone-600 sm:text-sm">
          選択UIと画像の見え方確認用です。本文への文字・写真の合成は、次の定規フェーズで行います。
        </p>
      </header>
      <div className="px-4 py-6 sm:px-6">
        <AshiatoTemplatesPreviewClient />
      </div>
    </div>
  );
}
