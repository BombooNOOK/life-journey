import Link from "next/link";

import { buildNumerologyBodyTextDump } from "@/lib/numerology/buildNumerologyBodyTextDump";

export default function AllBodiesPreviewPage() {
  const text = buildNumerologyBodyTextDump();

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-xl font-semibold text-stone-800">鑑定本文まとめ（全データ）</h1>
        <p className="mt-2 text-sm text-stone-600">
          <code className="rounded bg-stone-200 px-1">buildNumerologyBodyTextDump</code> の出力と同じです。ブラウザで検索・コピーできます。
        </p>
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-600">
          <Link href="/preview" className="text-stone-800 underline">
            確認メニュー
          </Link>
          <Link href="/preview/bridge-comments" className="text-stone-800 underline">
            ブリッジ一致度コメントだけ
          </Link>
          <Link href="/preview/life-path-rewrite" className="text-stone-800 underline">
            ライフパスだけ
          </Link>
        </p>
        <pre className="mt-6 overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-stone-200 bg-white p-4 text-sm leading-relaxed text-stone-800 shadow-sm">
          {text}
        </pre>
      </div>
    </div>
  );
}
