import Link from "next/link";

const guideButtonClass =
  "inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-emerald-200/80 bg-white/90 px-4 py-2.5 text-sm font-medium text-emerald-950 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/90 active:bg-emerald-50/90 sm:w-auto";

/** マイページ上部の /guide・/diary-guide 導線 */
export function MyPageGuideLink() {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 via-white to-amber-50/40 p-4 shadow-sm sm:p-5">
      <p className="text-sm font-semibold text-emerald-950">はじめての方へ</p>
      <p className="mt-1.5 text-sm leading-6 text-stone-700">
        Life Journey Diaryの考え方や、無料鑑定から日記・本棚・製本までの流れを確認できます。
      </p>
      <div className="relative z-10 mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-100/80 bg-white/60 p-3">
          <p className="text-sm font-semibold text-stone-900">歩き方</p>
          <p className="mt-1 text-xs leading-relaxed text-stone-600">
            LJDの考え方・鑑定書と日記のつながり
          </p>
          <Link href="/diary-guide" className={`${guideButtonClass} mt-3`}>
            歩き方を読む →
          </Link>
        </div>
        <div className="rounded-xl border border-emerald-100/80 bg-white/60 p-3">
          <p className="text-sm font-semibold text-stone-900">使い方</p>
          <p className="mt-1 text-xs leading-relaxed text-stone-600">
            無料鑑定から日記の記録・製本までの流れ
          </p>
          <Link href="/guide" className={`${guideButtonClass} mt-3`}>
            使い方を見る →
          </Link>
        </div>
      </div>
    </div>
  );
}
