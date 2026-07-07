"use client";

import { useCallback } from "react";

import { FirstVisitGuideCardPageLayout } from "@/components/guide/first-visit/FirstVisitGuideCardPageLayout";
import { FirstVisitGuideCardPanel } from "@/components/guide/first-visit/FirstVisitGuideCardStack";
import { useTransitionNavigation } from "@/components/ui/TransitionNavigationProvider";
import type { FirstVisitGuideCardAction } from "@/lib/onboarding/firstVisitWizard/cards";
import { FIRST_VISIT_GUIDE_STATION_SIGN_CARD } from "@/lib/onboarding/firstVisitWizard/cards";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";

/** 第4幕①：矢印看板 → 森の案内所へ */
export function FirstVisitGuideStationSignPage() {
  const { replace } = useTransitionNavigation();

  const handleAction = useCallback(
    (action: FirstVisitGuideCardAction, cardId: string) => {
      if (action === "next" && cardId === "guide-station-sign") {
        replace(FIRST_VISIT_ROUTES.guideStation);
      }
    },
    [replace],
  );

  return (
    <FirstVisitGuideCardPageLayout
      stepLabel="森の案内所へ"
      ariaLabel="森の案内所への案内"
      backHref={FIRST_VISIT_ROUTES.roadmap}
      backLabel="今日の道のりへ戻る"
    >
      <FirstVisitGuideCardPanel card={FIRST_VISIT_GUIDE_STATION_SIGN_CARD} onAction={handleAction} />
    </FirstVisitGuideCardPageLayout>
  );
}
