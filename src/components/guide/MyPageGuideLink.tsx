import Link from "next/link";

/** マイページ上部の /guide 導線 */
export function MyPageGuideLink() {
  return (
    <Link
      href="/guide"
      className="inline-flex items-center rounded-lg border border-stone-200 bg-stone-50/90 px-3 py-2 text-sm font-medium text-stone-800 transition hover:border-emerald-200 hover:bg-emerald-50/80 hover:text-emerald-950"
    >
      使い方を見る
    </Link>
  );
}
