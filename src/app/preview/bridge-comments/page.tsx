import Link from "next/link";

import { buildBridgeScoreCommentsDump } from "@/lib/numerology/buildBridgeScoreCommentsDump";

export default function BridgeCommentsPreviewPage() {
  const text = buildBridgeScoreCommentsDump();

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-xl font-semibold text-stone-800">ブリッジ一致度コメント一覧</h1>
        <p className="mt-2 text-sm text-stone-600">
          各章の参照テーブル（20〜100%）と、<code className="rounded bg-stone-200 px-1">pairKey</code>{" "}
          ごとに PDF で使う <code className="rounded bg-stone-200 px-1">scoreLabel</code>{" "}
          だけを並べています（長い本文は{" "}
          <Link href="/preview/all-bodies" className="text-stone-800 underline">
            鑑定本文まとめ
          </Link>
          ）。
        </p>
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-600">
          <Link href="/preview" className="text-stone-800 underline">
            確認メニュー
          </Link>
          <Link href="/verify" className="text-stone-800 underline">
            数値の突合
          </Link>
        </p>
        <pre className="mt-6 overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-stone-200 bg-white p-4 text-sm leading-relaxed text-stone-800 shadow-sm">
          {text}
        </pre>
      </div>
    </div>
  );
}
