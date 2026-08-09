"use client";

import Link from "next/link";

import { buildLoginHref } from "@/app/login/loginFlow";
import {
  heroCtaPrimaryClass,
  heroCtaSecondaryClass,
} from "@/components/home/heroCtaStyles";
import { OwlNavButton } from "@/components/ui/OwlNavButton";
import { useAboutPageCtaAudienceContext } from "@/components/about/AboutPageCtaAudienceProvider";
import {
  LOG_HOUSE_RETURN_TO_LABEL,
  LOG_HOUSE_LOADING_LABEL,
} from "@/lib/journal/logHouseLabels";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";

const JOURNAL_LOGIN_HREF = buildLoginHref("/journal");

function CtaPlaceholder() {
  return (
    <section
      className="rounded-2xl border border-emerald-100/90 bg-gradient-to-br from-emerald-50/50 via-white to-[#fffdf9] p-4 shadow-sm sm:p-5"
      aria-hidden
    >
      <div className="mx-auto h-5 w-48 rounded bg-stone-200/70" />
      <div className="mx-auto mt-4 h-12 w-full max-w-sm rounded-xl bg-stone-200/60" />
      <div className="mx-auto mt-3 h-12 w-full max-w-sm rounded-xl bg-stone-200/45" />
    </section>
  );
}

/** /about 上部：新規向け3導線 or 既存ユーザー向け導線 */
export function AboutPageQuickStartCta() {
  const { ready, showReturningUserCtas } = useAboutPageCtaAudienceContext();

  if (!ready) {
    return <CtaPlaceholder />;
  }

  if (showReturningUserCtas) {
    return (
      <section
        className="rounded-2xl border border-emerald-100/90 bg-gradient-to-br from-emerald-50/50 via-white to-[#fffdf9] p-4 shadow-sm sm:p-5"
        aria-labelledby="about-quick-start-heading"
      >
        <h2
          id="about-quick-start-heading"
          className="text-center text-sm font-semibold leading-snug text-stone-800 sm:text-base"
        >
          いつでも、記録を続けられます
        </h2>
        <div className="mx-auto mt-4 flex w-full max-w-sm flex-col gap-3">
          <OwlNavButton href="/journal" loadingLabel="あしあとを開いています…" className={heroCtaPrimaryClass}>
            あしあとを残す
          </OwlNavButton>
          <OwlNavButton
            href="/orders"
            loadingLabel={LOG_HOUSE_LOADING_LABEL}
            className={heroCtaSecondaryClass}
          >
            {LOG_HOUSE_RETURN_TO_LABEL}
          </OwlNavButton>
        </div>
      </section>
    );
  }

  return (
    <section
      className="rounded-2xl border border-emerald-100/90 bg-gradient-to-br from-emerald-50/50 via-white to-[#fffdf9] p-4 shadow-sm sm:p-5"
      aria-labelledby="about-quick-start-heading"
    >
      <h2
        id="about-quick-start-heading"
        className="text-center text-sm font-semibold leading-snug text-stone-800 sm:text-base"
      >
        まずは、あなたのページをひらく
      </h2>
      <div className="mx-auto mt-4 flex w-full max-w-sm flex-col gap-3">
        <Link href={FIRST_VISIT_ROUTES.pathGuide} className={heroCtaPrimaryClass}>
          無料鑑定をはじめる
        </Link>
        <Link href={JOURNAL_LOGIN_HREF} className={heroCtaSecondaryClass}>
          あしあとを残してみる
        </Link>
      </div>
      <p className="lj-read-desc mt-3 text-center leading-relaxed text-stone-600">
        お名前と生年月日だけで、Life Journey Diaryをお試しできます。
      </p>
      <p className="lj-read-desc mt-2 text-center text-stone-600">
        <Link href={FIRST_VISIT_ROUTES.pathGuide} className="text-emerald-900 hover:underline">
          はじめての方はこちら
        </Link>
      </p>
    </section>
  );
}
