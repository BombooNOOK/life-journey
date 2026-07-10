import Link from "next/link";
import { notFound } from "next/navigation";

import { LogHouseRoomPreviewClient } from "@/components/orders/loghouse-room/LogHouseRoomPreviewClient";

export default function LogHouseRoomPreviewPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#ebe4d4] text-stone-900">
      <div className="mx-auto max-w-lg px-4 py-6">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">Dev preview</p>
        <h1 className="mt-2 text-xl font-semibold text-stone-900">ログハウス室内UI</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Cursor の Simple Browser 用。ログイン不要でスマホ縦長の室内画面を確認できます。
        </p>
        <p className="mt-3 text-sm text-stone-600">
          開く URL:{" "}
          <code className="rounded bg-white/80 px-1.5 py-0.5 text-xs">
            http://127.0.0.1:3000/preview/loghouse-room
          </code>
        </p>
        <p className="mt-3">
          <Link href="/preview" className="text-sm text-stone-600 underline-offset-2 hover:underline">
            ← プレビュー一覧
          </Link>
          {" · "}
          <Link
            href="/preview/loghouse-room/layout"
            className="text-sm text-emerald-800 underline-offset-2 hover:underline"
          >
            レイアウト定規
          </Link>
        </p>

        <div className="mt-6">
          <LogHouseRoomPreviewClient />
        </div>
      </div>
    </div>
  );
}
