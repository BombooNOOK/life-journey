import type { Metadata } from "next";

import { FirstVisitWizardNav } from "@/components/guide/first-visit/FirstVisitWizardNav";
import { FirstVisitWizardPageHeader } from "@/components/guide/first-visit/FirstVisitWizardPageHeader";
import { HomeAboutSection } from "@/components/home/HomeAboutSection";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";

export const metadata: Metadata = {
  title: "はじめての方へ",
};

/** 第2幕：Life Journey Diaryとは（単独ページ） */
export default function FirstVisitAboutPage() {
  return (
    <div className="home-read-scope space-y-6">
      <FirstVisitWizardPageHeader stepLabel="Life Journey Diaryとは" />
      <HomeAboutSection />
      <FirstVisitWizardNav
        backHref={FIRST_VISIT_ROUTES.welcome}
        nextHref={FIRST_VISIT_ROUTES.owl}
      />
    </div>
  );
}
