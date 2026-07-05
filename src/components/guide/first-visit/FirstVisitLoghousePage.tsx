"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { buildLoginHref } from "@/app/login/loginFlow";
import { FirstVisitGuideCardStack } from "@/components/guide/first-visit/FirstVisitGuideCardStack";
import { FirstVisitGuideStage } from "@/components/guide/first-visit/FirstVisitGuideStage";
import { FirstVisitWizardPageHeader } from "@/components/guide/first-visit/FirstVisitWizardPageHeader";
import type { FirstVisitGuideCardAction } from "@/lib/onboarding/firstVisitWizard/cards";
import { FIRST_VISIT_LOGHOUSE_BUILD_CARDS } from "@/lib/onboarding/firstVisitWizard/cards";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import {
  clearFirstVisitFromRegisterFlag,
  readFirstVisitFromRegisterFlag,
} from "@/lib/onboarding/firstVisitWizard/session";
import { OwlLoadingPanel } from "@/components/ui/OwlLoadingPanel";

/** 第5幕：ログハウス建築 */
export function FirstVisitLoghousePage() {
  const router = useRouter();
  const { user, loading } = useFirebaseAuth();
  const isLoggedIn = Boolean(user?.email?.trim());

  const cards = useMemo(() => {
    if (readFirstVisitFromRegisterFlag()) {
      return FIRST_VISIT_LOGHOUSE_BUILD_CARDS;
    }
    return [FIRST_VISIT_LOGHOUSE_BUILD_CARDS[FIRST_VISIT_LOGHOUSE_BUILD_CARDS.length - 1]!];
  }, []);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (loading) return;
    if (!isLoggedIn) {
      router.replace(buildLoginHref(FIRST_VISIT_ROUTES.loghouse, "register"));
    }
  }, [isLoggedIn, loading, router]);

  const handleAction = useCallback(
    (action: FirstVisitGuideCardAction) => {
      if (action !== "next") return;

      if (index < cards.length - 1) {
        setIndex((prev) => prev + 1);
        return;
      }

      clearFirstVisitFromRegisterFlag();
      router.push(FIRST_VISIT_ROUTES.kantei);
    },
    [cards.length, index, router],
  );

  if (loading || !isLoggedIn) {
    return (
      <OwlLoadingPanel layout="page" label="ログイン状態を確認しています…" />
    );
  }

  return (
    <div className="home-read-scope min-h-[100dvh] pb-10">
      <FirstVisitWizardPageHeader stepLabel="ログハウスを建てる" className="px-4 pt-6 sm:px-6" />
      <FirstVisitGuideStage ariaLabel="ログハウス建築の案内">
        <FirstVisitGuideCardStack cards={cards} index={index} onAction={handleAction} />
      </FirstVisitGuideStage>
    </div>
  );
}
