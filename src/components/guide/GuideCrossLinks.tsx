import Link from "next/link";

import { SoftIllustrationAccent } from "@/components/ui/SoftIllustrationAccent";

/** /guide から /diary-guide への導線 */
export function LinkToDiaryGuide() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-100/90 bg-gradient-to-br from-[#fdfaf4] via-amber-50/30 to-white px-4 py-3.5">
      <div className="pointer-events-none absolute right-3 top-3 hidden select-none sm:block">
        <SoftIllustrationAccent variant="moon" size="sm" tone="amber" />
      </div>
      <p className="relative z-10 text-sm leading-6 text-stone-700">
        Life Journey Diary の考え方や、鑑定書と日記のつながりを知りたい方へ。
      </p>
      <Link
        href="/diary-guide"
        className="relative z-10 mt-2 inline-block text-sm font-medium text-emerald-900 underline-offset-2 hover:underline"
      >
        Life Journey Diaryの歩き方を読む →
      </Link>
    </div>
  );
}

/** /diary-guide から /guide への導線 */
export function LinkToOperationGuide() {
  return (
    <div className="rounded-xl border border-stone-200 bg-white px-4 py-3.5 shadow-sm">
      <p className="text-sm leading-6 text-stone-700">
        どこを押すか迷ったときのための、短い操作ヒントです。
      </p>
      <Link
        href="/guide"
        className="mt-2 inline-block text-sm font-medium text-emerald-900 underline-offset-2 hover:underline"
      >
        はじめての操作ヒント →
      </Link>
    </div>
  );
}
