import Link from "next/link";

import { CompanionWritingButtonLabel } from "@/components/journal/companion-writing/CompanionWritingButtonLabel";
import { LOG_HOUSE_TAGLINE } from "@/lib/journal/logHouseLabels";
import { FOREST_GUIDE_STATION_TITLE } from "@/lib/help/forestGuideStation";
import type { FirstVisitGuideState } from "@/lib/onboarding/firstVisitGuideState";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";

const panelClass =
  "rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 via-white to-amber-50/40 p-4 shadow-sm sm:p-5";

type Props = {
  state: FirstVisitGuideState;
  profileId: string;
  companionWritingHref: string;
};

/** ログハウス上部：初回状態に応じた案内 */
export function FirstVisitGuidePanel({ state, profileId, companionWritingHref }: Props) {
  if (state === "returning") return null;

  if (state === "needs_kantei") {
    return (
      <section className={panelClass} aria-labelledby="first-visit-guide-heading">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-800/80">
          はじめての方へ
        </p>
        <h2 id="first-visit-guide-heading" className="mt-1 text-base font-semibold text-emerald-950">
          まずは無料鑑定から
        </h2>
        <p className="mt-2 text-sm leading-6 text-stone-700">
          Life Journey Diary では、鑑定書と日記がつながっています。日記の読み解きコメントを受け取るには、先に無料鑑定が必要です。
        </p>
        <p className="mt-2 text-sm leading-6 text-stone-600">{LOG_HOUSE_TAGLINE}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/order?profile=${encodeURIComponent(profileId)}`}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900"
          >
            無料鑑定をはじめる
          </Link>
          <Link
            href={FIRST_VISIT_ROUTES.welcome}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-50/80"
          >
            はじめての方へ
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={panelClass} aria-labelledby="first-visit-guide-heading">
      <p className="text-xs font-medium uppercase tracking-wide text-emerald-800/80">
        はじめての方へ
      </p>
      <h2 id="first-visit-guide-heading" className="mt-1 text-base font-semibold text-emerald-950">
        最初の1ページを残してみましょう
      </h2>
      <p className="mt-2 text-sm leading-6 text-stone-700">
        鑑定はお済みです。次は、どうぶつ鑑定士といっしょに、今日の気分から短く書き始められます。特別な文章でなくて大丈夫です。
      </p>
      <p className="mt-2 text-sm leading-6 text-stone-600">{LOG_HOUSE_TAGLINE}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={companionWritingHref}
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900"
        >
          <CompanionWritingButtonLabel />
        </Link>
        <Link
          href="/guide/first"
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-50/80"
        >
          初めての3分ガイド
        </Link>
      </div>
    </section>
  );
}

/** 日記1件以上：小さな歩き方リンク */
export function ReturningUserGuideHint() {
  return (
    <p className="text-sm text-stone-600">
      <Link
        href="/help/ljd"
        className="font-medium text-emerald-900 underline-offset-2 hover:underline"
      >
        {FOREST_GUIDE_STATION_TITLE}
      </Link>
      <span className="text-stone-500"> — 困ったときや、機能の全体像はこちら</span>
    </p>
  );
}
