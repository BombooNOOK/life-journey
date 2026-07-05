"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { buildLoginHref } from "@/app/login/loginFlow";
import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { FirstVisitGuideCardPageLayout } from "@/components/guide/first-visit/FirstVisitGuideCardPageLayout";
import { FirstVisitGuideCardPanel } from "@/components/guide/first-visit/FirstVisitGuideCardStack";
import type { FirstVisitGuideCardAction } from "@/lib/onboarding/firstVisitWizard/cards";
import { FIRST_VISIT_RESIDENT_REGISTRATION_CARD } from "@/lib/onboarding/firstVisitWizard/cards";
import { firstVisitReadyNextHref } from "@/lib/onboarding/firstVisitWizard/readyNavigation";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import { setFirstVisitFromRegisterFlag } from "@/lib/onboarding/firstVisitWizard/session";
import type { FirstVisitReadyBranch } from "@/lib/viewer/firstVisitReadyContext";
import { OwlLoadingPanel } from "@/components/ui/OwlLoadingPanel";

/** 第4幕：森の住民登録（未ログイン向け） */
export function FirstVisitRegisterPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useFirebaseAuth();
  const isLoggedIn = Boolean(user?.email?.trim());
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (authLoading || !isLoggedIn) return;

    let cancelled = false;
    setRedirecting(true);

    void fetch("/api/viewer/first-visit-ready-context", { credentials: "same-origin" })
      .then(async (res) => {
        if (!res.ok) throw new Error("context fetch failed");
        return (await res.json()) as { branch: FirstVisitReadyBranch };
      })
      .then((data) => {
        if (cancelled) return;
        const href = firstVisitReadyNextHref(data.branch);
        router.replace(href);
      })
      .catch(() => {
        if (!cancelled) router.replace(FIRST_VISIT_ROUTES.kanteiReady);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, isLoggedIn, router]);

  const handleAction = useCallback(
    (action: FirstVisitGuideCardAction, _cardId: string) => {
      if (action === "register") {
        setFirstVisitFromRegisterFlag();
        router.push(buildLoginHref(FIRST_VISIT_ROUTES.loghouse, "register"));
        return;
      }

      if (action === "login") {
        router.push(buildLoginHref(FIRST_VISIT_ROUTES.kantei, "login"));
      }
    },
    [router],
  );

  if (authLoading || redirecting || isLoggedIn) {
    return (
      <OwlLoadingPanel
        layout="page"
        label="案内を読み込んでいます…"
        hint="フクロウが回っているあいだはそのままお待ちください。"
      />
    );
  }

  return (
    <FirstVisitGuideCardPageLayout
      stepLabel="森の住民登録"
      ariaLabel="森の住民登録の案内"
      backHref={FIRST_VISIT_ROUTES.ready}
    >
      <FirstVisitGuideCardPanel
        card={FIRST_VISIT_RESIDENT_REGISTRATION_CARD}
        onAction={handleAction}
      />
    </FirstVisitGuideCardPageLayout>
  );
}
