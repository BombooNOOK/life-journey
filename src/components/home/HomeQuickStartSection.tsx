import Link from "next/link";

import { heroCtaPrimaryClass } from "@/components/home/heroCtaStyles";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";

/** はじめての方へ：動画の直後に置く、やわらかい開始導線 */
export function HomeQuickStartSection() {
  return (
    <section
      className="rounded-2xl border border-emerald-100/90 bg-gradient-to-br from-emerald-50/50 via-white to-[#fffdf9] p-4 shadow-sm sm:p-5"
      aria-labelledby="home-quick-start-heading"
    >
      <h2
        id="home-quick-start-heading"
        className="text-center text-sm font-semibold leading-snug text-stone-800 sm:text-base"
      >
        まずは、あなたのページをひらく
      </h2>
      <div className="mx-auto mt-4 flex w-full max-w-sm flex-col">
        <Link href={FIRST_VISIT_ROUTES.pathGuide} className={heroCtaPrimaryClass}>
          無料鑑定をはじめる
        </Link>
      </div>
      <p className="lj-read-desc mt-3 text-center leading-relaxed text-stone-600">
        お名前と生年月日だけで、Life Journey Diaryをお試しできます。
      </p>
    </section>
  );
}
