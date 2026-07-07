"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { FirstVisitGuideCardPageLayout } from "@/components/guide/first-visit/FirstVisitGuideCardPageLayout";
import { FirstVisitGuideCardPanel } from "@/components/guide/first-visit/FirstVisitGuideCardStack";
import type { FirstVisitGuideCardAction } from "@/lib/onboarding/firstVisitWizard/cards";
import { FIRST_VISIT_GUIDE_STATION_SIGN_CARD } from "@/lib/onboarding/firstVisitWizard/cards";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";

/** 第4幕①：矢印看板 → 森の案内所へ */
export function FirstVisitGuideStationSignPage() {
  const router = useRouter();

  const handleAction = useCallback(
    (action: FirstVisitGuideCardAction, cardId: string) => {
      if (action === "next" && cardId === "guide-station-sign") {
        router.push(FIRST_VISIT_ROUTES.guideStation);
      }
    },
    [router],
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
