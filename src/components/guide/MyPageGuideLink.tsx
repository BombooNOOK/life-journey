import Link from "next/link";

import { FOREST_GUIDE_STATION_TITLE } from "@/lib/help/forestGuideStation";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";

const guideButtonClass =
  "inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-emerald-200/80 bg-white/90 px-4 py-2.5 text-sm font-medium text-emerald-950 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/90 active:bg-emerald-50/90 sm:w-auto";

/** ログハウス上部の 森の案内所・初回ガイド導線 */
export function MyPageGuideLink() {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 via-white to-amber-50/40 p-4 shadow-sm sm:p-5">
      <p className="text-sm font-semibold text-emerald-950">Life Journey Diary の歩き方</p>
      <p className="mt-1.5 text-sm leading-6 text-stone-700">
        BambooNOOKの森で、今日のページをひらくための案内です。はじめての方は短いガイドから、くわしく知りたいときは目次から読めます。
      </p>
      <div className="relative z-10 mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-100/80 bg-white/60 p-3">
          <p className="text-sm font-semibold text-stone-900">はじめての方へ</p>
          <p className="mt-1 text-xs leading-relaxed text-stone-600">
            BambooNOOKの森から、やさしく案内します
          </p>
          <Link href={FIRST_VISIT_ROUTES.welcome} className={`${guideButtonClass} mt-3`}>
            はじめての方へ →
          </Link>
        </div>
        <div className="rounded-xl border border-emerald-100/80 bg-white/60 p-3">
          <p className="text-sm font-semibold text-stone-900">{FOREST_GUIDE_STATION_TITLE}</p>
          <p className="mt-1 text-xs leading-relaxed text-stone-600">
            目次から、必要な項目だけ読める
          </p>
          <Link href="/help/ljd" className={`${guideButtonClass} mt-3`}>
            {FOREST_GUIDE_STATION_TITLE} →
          </Link>
        </div>
      </div>
      <p className="mt-3 text-xs text-stone-500">
        画面操作の流れは
        <Link href="/guide" className="mx-1 text-emerald-900 underline-offset-2 hover:underline">
          使い方
        </Link>
        もご覧ください。
      </p>
    </div>
  );
}
