import Link from "next/link";

import { buildLoginHref } from "@/app/login/loginFlow";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import { LOG_HOUSE_PAGE_TITLE } from "@/lib/journal/logHouseLabels";

const panelClass =
  "rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 via-white to-amber-50/40 p-5 shadow-sm sm:p-6";

const primaryButtonClass =
  "inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-emerald-800 px-5 py-3 text-base font-medium text-white shadow-sm transition hover:bg-emerald-900";

const secondaryButtonClass =
  "inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-emerald-200 bg-white px-5 py-3 text-base font-medium text-emerald-950 shadow-sm transition hover:bg-emerald-50/80";

/** 未ログインで /orders に来たときの案内 */
export function LogHouseGuestEntrance() {
  return (
    <div className="home-read-scope space-y-6">
      <h1 className="text-2xl font-bold text-stone-900 sm:text-[1.625rem]">{LOG_HOUSE_PAGE_TITLE}</h1>

      <section className={panelClass} aria-labelledby="loghouse-guest-entrance-heading">
        <h2 id="loghouse-guest-entrance-heading" className="text-lg font-semibold text-emerald-950">
          ここは、あなたのログハウスです。
        </h2>
        <p className="mt-3 text-sm leading-7 text-stone-700 sm:text-[15px]">
          はじめての方は、森の案内を見てから
          <br className="sm:hidden" />
          ログハウスを建てる流れがおすすめです。
        </p>
        <div className="mt-5 flex flex-col gap-3">
          <Link href={FIRST_VISIT_ROUTES.welcome} className={primaryButtonClass}>
            はじめての方はこちら
          </Link>
          <Link href={buildLoginHref("/orders", "login")} className={secondaryButtonClass}>
            ログインする
          </Link>
        </div>
      </section>
    </div>
  );
}
