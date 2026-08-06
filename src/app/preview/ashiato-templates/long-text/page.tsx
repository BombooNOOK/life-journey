import type { Metadata } from "next";

import { AshiatoLongTextOverflowPreviewClient } from "./AshiatoLongTextOverflowPreviewClient";
import { assertDevOrAdminPreviewAccess } from "@/lib/preview/assertDevOrAdminPreviewAccess";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "プレビュー：あしあと長文のはみ出し確認",
};

/** 全テンプレ × 文字サイズで、長文の裁ち落としと警告段階を一括確認 */
export default async function AshiatoLongTextOverflowPreviewPage() {
  await assertDevOrAdminPreviewAccess();

  return (
    <div className="min-h-screen bg-[#f7f4ef] text-stone-900">
      <header className="border-b border-stone-200 bg-[#faf8f5] px-4 py-4 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-wide text-amber-800">
          Preview
        </p>
        <h1 className="mt-1 text-lg font-semibold sm:text-xl">
          あしあとブック：長文のはみ出し一括確認
        </h1>
        <p className="mt-1 text-xs leading-relaxed text-stone-600 sm:text-sm">
          ログイン不要（ローカル開発）。上のサンプル文を改行しながら、全テンプレ×文字サイズのはみ出しをまとめて確認できます。
        </p>
      </header>
      <div className="px-4 py-6 sm:px-6">
        <AshiatoLongTextOverflowPreviewClient />
      </div>
    </div>
  );
}
