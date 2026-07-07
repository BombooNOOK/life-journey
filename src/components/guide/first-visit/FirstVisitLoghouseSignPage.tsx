"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

import { buildLoginHref } from "@/app/login/loginFlow";
import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { FirstVisitGuideCardPageLayout } from "@/components/guide/first-visit/FirstVisitGuideCardPageLayout";
import { FirstVisitGuideCardPanel } from "@/components/guide/first-visit/FirstVisitGuideCardStack";
import { useTransitionNavigation } from "@/components/ui/TransitionNavigationProvider";
import type { FirstVisitGuideCardAction } from "@/lib/onboarding/firstVisitWizard/cards";
import { FIRST_VISIT_LOGHOUSE_SIGN_CARD } from "@/lib/onboarding/firstVisitWizard/cards";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import { OwlLoadingPanel } from "@/components/ui/OwlLoadingPanel";

/** 第5幕②：ログハウス建築前の看板 */
export function FirstVisitLoghouseSignPage() {
  const router = useRouter();
  const { replace } = useTransitionNavigation();
  const { user, loading: authLoading } = useFirebaseAuth();
  const isLoggedIn = Boolean(user?.email?.trim());

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      router.replace(buildLoginHref(FIRST_VISIT_ROUTES.loghouseSign, "login"));
    }
  }, [authLoading, isLoggedIn, router]);

  const handleAction = useCallback(
    (action: FirstVisitGuideCardAction, cardId: string) => {
      if (action !== "next" || cardId !== "loghouse-sign") return;
      replace(FIRST_VISIT_ROUTES.loghouse);
    },
    [replace],
  );

  if (authLoading || !isLoggedIn) {
    return (
      <OwlLoadingPanel
        layout="page"
        label="案内を読み込んでいます…"
        hint="フクロウが回っているあいだはそのままお待ちください。"
      />
    );
  }

  return (
    <FirstVisitGuideCardPageLayout stepLabel="ログハウスへ" ariaLabel="ログハウス建築の案内">
      <FirstVisitGuideCardPanel card={FIRST_VISIT_LOGHOUSE_SIGN_CARD} onAction={handleAction} />
    </FirstVisitGuideCardPageLayout>
  );
}
