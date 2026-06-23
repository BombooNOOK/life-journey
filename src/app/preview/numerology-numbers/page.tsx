import type { Metadata } from "next";
import Link from "next/link";

import { NumerologyNumbersDictionaryView } from "@/components/journal/NumerologyNumbersDictionaryView";

export const metadata: Metadata = {
  title: "数字の意味辞書（校正プレビュー）",
  robots: { index: false, follow: false },
};

export default function PreviewNumerologyNumbersPage() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-stone-600">
          <Link href="/preview" className="underline hover:text-stone-900">
            ← 校正メニューへ
          </Link>
          {" · "}
          <Link href="/help/numerology-numbers" className="underline hover:text-stone-900">
            本番ページ（/help）
          </Link>
        </p>
        <p className="mt-2 text-xs text-stone-500">ログイン不要 · npm run dev 中のみ想定</p>
        <div className="mt-6">
          <NumerologyNumbersDictionaryView compact />
        </div>
      </div>
    </div>
  );
}
