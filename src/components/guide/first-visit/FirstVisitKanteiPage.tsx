"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { buildLoginHref } from "@/app/login/loginFlow";
import { FirstVisitGuideCardStack } from "@/components/guide/first-visit/FirstVisitGuideCardStack";
import { FirstVisitGuideStage } from "@/components/guide/first-visit/FirstVisitGuideStage";
import { FirstVisitWizardPageHeader } from "@/components/guide/first-visit/FirstVisitWizardPageHeader";
import type { FirstVisitGuideCardAction } from "@/lib/onboarding/firstVisitWizard/cards";
import { FIRST_VISIT_KANTEI_PROCEED_CARD } from "@/lib/onboarding/firstVisitWizard/cards";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import { setFirstVisitOrderGuideFlag } from "@/lib/onboarding/firstVisitWizard/session";

/** 第6幕：鑑定前説明 → /order へ */
export function FirstVisitKanteiPage() {
  const router = useRouter();
  const { user, loading } = useFirebaseAuth();
  const isLoggedIn = Boolean(user?.email?.trim());

  useEffect(() => {
    if (loading) return;
    if (!isLoggedIn) {
      router.replace(buildLoginHref(FIRST_VISIT_ROUTES.kantei, "login"));
    }
  }, [isLoggedIn, loading, router]);

  const handleAction = useCallback(
    (action: FirstVisitGuideCardAction) => {
      if (action !== "next") return;
      setFirstVisitOrderGuideFlag();
      router.push("/order");
    },
    [router],
  );

  if (loading || !isLoggedIn) {
    return (
      <div className="home-read-scope flex min-h-[40vh] items-center justify-center px-4">
        <p className="text-sm text-stone-600">読み込み中…</p>
      </div>
    );
  }

  return (
    <div className="home-read-scope min-h-[100dvh] pb-10">
      <FirstVisitWizardPageHeader stepLabel="鑑定へ進む" className="px-4 pt-6 sm:px-6" />
      <FirstVisitGuideStage ariaLabel="鑑定前の案内">
        <FirstVisitGuideCardStack
          cards={[FIRST_VISIT_KANTEI_PROCEED_CARD]}
          index={0}
          onAction={handleAction}
        />
      </FirstVisitGuideStage>
    </div>
  );
}
