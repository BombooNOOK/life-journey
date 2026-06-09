import Link from "next/link";

import { TRIAL_COPY } from "@/lib/entitlement/trialStatusCopy";
import type { SerializedUserEntitlement, TrialBannerVariant } from "@/lib/entitlement/resolveUserEntitlement";

type Props = {
  entitlement: SerializedUserEntitlement;
};

function bannerStyles(variant: TrialBannerVariant): string {
  switch (variant) {
    case "not_started":
      return "border-emerald-200 bg-emerald-50/80 text-emerald-950";
    case "warning":
      return "border-amber-200 bg-amber-50/80 text-amber-950";
    case "expired":
      return "border-violet-200 bg-violet-50/70 text-violet-950";
    default:
      return "border-stone-200 bg-stone-50 text-stone-800";
  }
}

export function TrialStatusBanner({ entitlement }: Props) {
  if (!entitlement.showTrialBanner || entitlement.bannerVariant === "none") {
    return null;
  }

  const copy = TRIAL_COPY[entitlement.bannerVariant];
  const showPlansLink = entitlement.bannerVariant === "warning" || entitlement.bannerVariant === "expired";

  return (
    <section
      aria-labelledby="trial-status-banner-heading"
      className={`rounded-xl border p-4 shadow-sm sm:p-5 ${bannerStyles(entitlement.bannerVariant)}`}
    >
      <h2 id="trial-status-banner-heading" className="text-sm font-semibold">
        {copy.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed">{copy.body}</p>
      {entitlement.trialDaysRemaining !== null && entitlement.bannerVariant === "warning" ? (
        <p className="mt-2 text-xs font-medium">
          無料お試し残り：あと {entitlement.trialDaysRemaining} 日
        </p>
      ) : null}
      {showPlansLink ? (
        <Link
          href="/plans"
          className="mt-4 inline-flex min-h-[44px] items-center rounded-lg bg-stone-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700"
        >
          プランを見る
        </Link>
      ) : null}
    </section>
  );
}
