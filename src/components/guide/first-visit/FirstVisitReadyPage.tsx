"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { FirstVisitGuideCardStack } from "@/components/guide/first-visit/FirstVisitGuideCardStack";
import { FirstVisitGuideStage } from "@/components/guide/first-visit/FirstVisitGuideStage";
import { FirstVisitWizardPageHeader } from "@/components/guide/first-visit/FirstVisitWizardPageHeader";
import { buildLoginHref } from "@/app/login/loginFlow";
import type { FirstVisitGuideCardAction } from "@/lib/onboarding/firstVisitWizard/cards";
import { FIRST_VISIT_KANTEI_READY_CARDS } from "@/lib/onboarding/firstVisitWizard/cards";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import { setFirstVisitFromRegisterFlag } from "@/lib/onboarding/firstVisitWizard/session";

/** 第4幕：鑑定前の案内（アカウント作成 / ログイン分岐） */
export function FirstVisitReadyPage() {
  const router = useRouter();
  const { user, loading } = useFirebaseAuth();
  const isLoggedIn = Boolean(user?.email?.trim());

  const cards = useMemo(() => {
    if (isLoggedIn) {
      return [FIRST_VISIT_KANTEI_READY_CARDS[0]!];
    }
    return FIRST_VISIT_KANTEI_READY_CARDS;
  }, [isLoggedIn]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [isLoggedIn]);

  const handleAction = useCallback(
    (action: FirstVisitGuideCardAction, cardId: string) => {
      if (action === "next") {
        if (cardId === "kantei-start") {
          if (isLoggedIn) {
            router.push(FIRST_VISIT_ROUTES.kantei);
            return;
          }
          setIndex(1);
          return;
        }
        router.push(FIRST_VISIT_ROUTES.kantei);
        return;
      }

      if (action === "register") {
        setFirstVisitFromRegisterFlag();
        router.push(buildLoginHref(FIRST_VISIT_ROUTES.loghouse, "register"));
        return;
      }

      if (action === "login") {
        router.push(buildLoginHref(FIRST_VISIT_ROUTES.kantei, "login"));
      }
    },
    [isLoggedIn, router],
  );

  if (loading) {
    return (
      <div className="home-read-scope flex min-h-[40vh] items-center justify-center px-4">
        <p className="text-sm text-stone-600">読み込み中…</p>
      </div>
    );
  }

  return (
    <div className="home-read-scope min-h-[100dvh] pb-10">
      <FirstVisitWizardPageHeader stepLabel="鑑定の準備" className="px-4 pt-6 sm:px-6" />
      <FirstVisitGuideStage ariaLabel="鑑定前の案内">
        <FirstVisitGuideCardStack cards={cards} index={index} onAction={handleAction} />
      </FirstVisitGuideStage>
    </div>
  );
}
