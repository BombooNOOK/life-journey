import type { ReactNode } from "react";
import Link from "next/link";

import { FirstVisitGuideStage } from "@/components/guide/first-visit/FirstVisitGuideStage";
import { FirstVisitWizardNav } from "@/components/guide/first-visit/FirstVisitWizardNav";
import { FirstVisitWizardPageHeader } from "@/components/guide/first-visit/FirstVisitWizardPageHeader";

type Props = {
  stepLabel: string;
  ariaLabel: string;
  backHref?: string;
  children: ReactNode;
};

/**
 * 初回導線の1枚カードページ。
 * スマホは手前に浮かせ、PC（lg+）は通常ページとして表示する。
 */
export function FirstVisitGuideCardPageLayout({ stepLabel, ariaLabel, backHref, children }: Props) {
  return (
    <div className="home-read-scope min-h-[100dvh] pb-10">
      <FirstVisitWizardPageHeader stepLabel={stepLabel} className="hidden px-4 pt-6 sm:px-6 lg:block" />

      <div className="lg:hidden">
        <FirstVisitGuideStage ariaLabel={ariaLabel}>
          {backHref ? (
            <Link
              href={backHref}
              className="mb-3 inline-flex min-h-[44px] items-center text-sm font-medium text-stone-600 hover:text-stone-900"
            >
              ← もどる
            </Link>
          ) : null}
          {children}
        </FirstVisitGuideStage>
      </div>

      <div className="mx-auto hidden w-full max-w-lg px-4 pt-8 sm:px-6 lg:block">
        {children}
        {backHref ? (
          <FirstVisitWizardNav backHref={backHref} backLabel="もどる" showNext={false} />
        ) : null}
      </div>
    </div>
  );
}
