import Link from "next/link";

import { heroCtaPrimaryClass, heroCtaSecondaryClass } from "@/components/home/heroCtaStyles";

/** はじめての方へ：説明の直後に置く早速始める導線 */
export function HomeQuickStartSection() {
  return (
    <section
      className="rounded-2xl border border-emerald-100/90 bg-gradient-to-br from-emerald-50/50 via-white to-[#fffdf9] p-4 shadow-sm sm:p-5"
      aria-labelledby="home-quick-start-heading"
    >
      <h2
        id="home-quick-start-heading"
        className="text-center text-sm font-semibold text-stone-800 sm:text-base"
      >
        説明を読まずに、いますぐ始める
      </h2>
      <div className="mx-auto mt-4 flex w-full max-w-sm flex-col gap-3">
        <Link href="/order" className={heroCtaPrimaryClass}>
          早速始める
        </Link>
        <Link href="/order" className={heroCtaSecondaryClass}>
          無料鑑定をはじめる
        </Link>
      </div>
      <p className="mt-3 text-center text-[0.625rem] leading-relaxed text-stone-500">
        お名前と生年月日だけで無料鑑定へ。下の説明はあとから読めます。
      </p>
    </section>
  );
}
