import type { Metadata } from "next";

import { AshiatoTemplatesLayoutDebugClient } from "./AshiatoTemplatesLayoutDebugClient";
import { assertDevOrAdminPreviewAccess } from "@/lib/preview/assertDevOrAdminPreviewAccess";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "プレビュー：あしあとページのかたち レイアウト定規",
};

/** あしあと本文テンプレ：写真・日付・本文などの配置定規 */
export default async function AshiatoTemplatesLayoutPage() {
  await assertDevOrAdminPreviewAccess();

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-stone-50 px-4 py-4 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-wide text-amber-800">Layout tool</p>
        <h1 className="mt-1 text-lg font-semibold sm:text-xl">
          あしあとブック：ページのかたち レイアウト定規
        </h1>
        <p className="mt-1 text-xs leading-relaxed text-stone-600 sm:text-sm">
          721×1024 基準（%）。Cursor内ブラウザは拡大率45%が目安です。枠を合わせて「この配置をファイルに保存」→本番接続を依頼してください。
        </p>
      </header>
      <div className="px-4 py-5 sm:px-6">
        <AshiatoTemplatesLayoutDebugClient />
      </div>
    </div>
  );
}
