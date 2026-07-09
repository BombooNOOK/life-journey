"use client";

import { useCallback } from "react";

import { FirstVisitGuideCardPageLayout } from "@/components/guide/first-visit/FirstVisitGuideCardPageLayout";
import { FirstVisitGuideCardPanel } from "@/components/guide/first-visit/FirstVisitGuideCardStack";
import { useTransitionNavigation } from "@/components/ui/TransitionNavigationProvider";
import type { FirstVisitGuideCardAction } from "@/lib/onboarding/firstVisitWizard/cards";
import { FIRST_VISIT_CHAPTER_3_SIGN_CARD } from "@/lib/onboarding/firstVisitWizard/cards";
import { FIRST_VISIT_CHAPTER_3_ENTRY_HREF } from "@/lib/onboarding/firstVisitWizard/chapters";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";

/** 第3章前：行き先看板 → ログハウスで日記 */
export function FirstVisitChapter3SignPage() {
  const { replace } = useTransitionNavigation();

  const handleAction = useCallback(
    (action: FirstVisitGuideCardAction, cardId: string) => {
      if (action === "next" && cardId === "chapter-3-sign") {
        replace(FIRST_VISIT_CHAPTER_3_ENTRY_HREF);
      }
    },
    [replace],
  );

  return (
    <FirstVisitGuideCardPageLayout
      stepLabel="ログハウスへ"
      ariaLabel="ログハウスでの日記の案内"
      backHref={FIRST_VISIT_ROUTES.pathGuide}
      backLabel="はじめての道しるべへ戻る"
    >
      <FirstVisitGuideCardPanel card={FIRST_VISIT_CHAPTER_3_SIGN_CARD} onAction={handleAction} />
    </FirstVisitGuideCardPageLayout>
  );
}
