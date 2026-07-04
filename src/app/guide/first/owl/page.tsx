import type { Metadata } from "next";

import { FirstVisitWizardNav } from "@/components/guide/first-visit/FirstVisitWizardNav";
import { FirstVisitWizardPageHeader } from "@/components/guide/first-visit/FirstVisitWizardPageHeader";
import { HomeOwlNavigatorIntroSection } from "@/components/home/HomeOwlNavigatorIntroSection";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";

export const metadata: Metadata = {
  title: "はじめての方へ",
};

/** 第3幕：フクロウ先生あいさつ（単独ページ） */
export default function FirstVisitOwlPage() {
  return (
    <div className="home-read-scope space-y-6">
      <FirstVisitWizardPageHeader stepLabel="フクロウ先生あいさつ" />
      <HomeOwlNavigatorIntroSection />
      <FirstVisitWizardNav
        backHref={FIRST_VISIT_ROUTES.about}
        nextHref={FIRST_VISIT_ROUTES.ready}
      />
    </div>
  );
}
