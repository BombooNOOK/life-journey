import type { Metadata } from "next";

import {
  ForestBookshelfLayoutDebugClient,
  ForestBookshelfLayoutDebugLinks,
} from "./ForestBookshelfLayoutDebugClient";
import { assertDevOrAdminPreviewAccess } from "@/lib/preview/assertDevOrAdminPreviewAccess";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "プレビュー：森の本棚レイアウト定規",
};

/** 森の本棚：見た目・タップ領域の定規（開発、または本番の管理者） */
export default async function ForestBookshelfLayoutPage() {
  await assertDevOrAdminPreviewAccess();

  return (
    <div className="fixed inset-0 z-0 flex flex-col bg-stone-50 text-stone-900">
      <header className="shrink-0 border-b border-stone-200 bg-stone-50 px-3 py-3 sm:px-4">
        <p className="text-xs font-medium uppercase tracking-wide text-amber-800">Layout tool</p>
        <h1 className="mt-1 text-lg font-semibold sm:text-xl">森の本棚レイアウト定規</h1>
        <p className="mt-1 text-xs leading-relaxed text-stone-600 sm:text-sm">
          Cursor内ブラウザ向け：下の枠を上下スクロール、拡大率は既定45%。点線枠＝タップ領域（最初からタップ編集）。実線枠＝見た目。終わったら「この配置をファイルに保存」→本番反映を依頼してください。
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
