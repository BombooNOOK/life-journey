import { ForestBuildingIllustration } from "@/components/guide/first-visit/ForestBuildingIllustration";
import { FirstVisitWizardNav } from "@/components/guide/first-visit/FirstVisitWizardNav";
import { FirstVisitWizardPageHeader } from "@/components/guide/first-visit/FirstVisitWizardPageHeader";
import {
  FIRST_VISIT_GUIDE_STATION_WELCOME_BODY,
  FIRST_VISIT_GUIDE_STATION_WELCOME_BUTTON,
  FIRST_VISIT_GUIDE_STATION_WELCOME_HEADING,
} from "@/lib/onboarding/firstVisitWizard/guideStationCopy";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";

/** 第4幕②：初回専用・森の案内所（メニューなし） */
export function FirstVisitGuideStationPage() {
  return (
    <div className="home-read-scope mx-auto w-full max-w-lg space-y-6 px-4 pb-8 pt-6 sm:px-6 sm:pt-8 lg:space-y-6">
      <FirstVisitWizardPageHeader stepLabel="森の案内所" className="hidden lg:block" />

      <section
        className="lg:rounded-2xl lg:border lg:border-stone-200/70 lg:bg-[#fffdf9] lg:p-5 lg:shadow-sm"
        aria-labelledby="first-visit-guide-station-heading"
      >
        <ForestBuildingIllustration building="guideStation" className="mb-4 sm:mb-5" />

        <h2
          id="first-visit-guide-station-heading"
          className="text-base font-semibold leading-snug text-stone-900 sm:text-lg"
        >
          {FIRST_VISIT_GUIDE_STATION_WELCOME_HEADING}
        </h2>

        <p className="lj-read-desc mt-4 whitespace-pre-line leading-[1.65] text-stone-600 sm:leading-7">
          {FIRST_VISIT_GUIDE_STATION_WELCOME_BODY}
        </p>
      </section>

      <FirstVisitWizardNav
        backHref={FIRST_VISIT_ROUTES.guideStationSign}
        backLabel="案内看板へ戻る"
        nextHref={FIRST_VISIT_ROUTES.register}
        nextLabel={FIRST_VISIT_GUIDE_STATION_WELCOME_BUTTON}
        showBack
        showNext
      />
    </div>
  );
}
