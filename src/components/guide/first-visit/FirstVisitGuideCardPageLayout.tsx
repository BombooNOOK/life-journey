"use client";

import type { ReactNode } from "react";

import { FirstVisitGuideStage } from "@/components/guide/first-visit/FirstVisitGuideStage";
import { FirstVisitPauseLink } from "@/components/guide/first-visit/FirstVisitPauseLink";
import { FirstVisitWizardNav } from "@/components/guide/first-visit/FirstVisitWizardNav";
import { FirstVisitWizardPageHeader } from "@/components/guide/first-visit/FirstVisitWizardPageHeader";
import { useTransitionNavigation } from "@/components/ui/TransitionNavigationProvider";

type Props = {
  stepLabel: string;
  ariaLabel: string;
  backHref?: string;
  backLabel?: string;
  /** 未指定時は backHref がないページで表示 */
  showPauseLink?: boolean;
  children: ReactNode;
};

/**
 * 初回導線の1枚カードページ。
 * スマホは手前に浮かせ、PC（lg+）は通常ページとして表示する。
 */
export function FirstVisitGuideCardPageLayout({
  stepLabel,
  ariaLabel,
  backHref,
  backLabel = "もどる",
  showPauseLink,
  children,
}: Props) {
  const { replace, isPending } = useTransitionNavigation();
  const shouldShowPause = showPauseLink ?? !backHref;

  return (
    <div className="home-read-scope min-h-[100dvh] pb-10">
      <FirstVisitWizardPageHeader stepLabel={stepLabel} className="hidden px-4 pt-6 sm:px-6 lg:block" />

      <div className="lg:hidden">
        <FirstVisitGuideStage ariaLabel={ariaLabel}>
          {backHref ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => replace(backHref)}
              className="mb-3 inline-flex min-h-[44px] items-center text-sm font-medium text-stone-600 transition active:scale-[0.98] hover:text-stone-900"
            >
              ← {backLabel}
            </button>
          ) : null}
          {children}
          {shouldShowPause ? (
            <p className="mt-6 text-center">
              <FirstVisitPauseLink />
            </p>
          ) : null}
        </FirstVisitGuideStage>
      </div>

      <div className="mx-auto hidden w-full max-w-lg px-4 pt-8 sm:px-6 lg:block">
        {children}
        {backHref ? (
          <FirstVisitWizardNav backHref={backHref} backLabel={backLabel} showNext={false} />
        ) : null}
        {shouldShowPause ? (
          <p className="mt-4 text-center">
            <FirstVisitPauseLink />
          </p>
        ) : null}
      </div>
    </div>
  );
}
