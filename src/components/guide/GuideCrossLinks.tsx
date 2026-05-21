import Link from "next/link";

/** /guide から /diary-guide への導線 */
export function LinkToDiaryGuide() {
  return (
    <div className="rounded-xl border border-amber-100/90 bg-[#fdfaf4] px-4 py-3.5">
      <p className="text-sm leading-6 text-stone-700">
        Life Journey Diary の考え方や、鑑定書と日記のつながりを知りたい方へ。
      </p>
      <Link
        href="/diary-guide"
        className="mt-2 inline-block text-sm font-medium text-emerald-900 underline-offset-2 hover:underline"
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
        画面の操作手順や、無料鑑定・本棚・製本までの流れはこちらです。
      </p>
      <Link
        href="/guide"
        className="mt-2 inline-block text-sm font-medium text-emerald-900 underline-offset-2 hover:underline"
      >
        操作方法を見る →
      </Link>
    </div>
  );
}
