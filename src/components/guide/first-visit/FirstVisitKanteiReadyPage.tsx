"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { FirstVisitGuideCardPageLayout } from "@/components/guide/first-visit/FirstVisitGuideCardPageLayout";
import { FirstVisitGuideCardPanel } from "@/components/guide/first-visit/FirstVisitGuideCardStack";
import type { FirstVisitGuideCardAction } from "@/lib/onboarding/firstVisitWizard/cards";
import { FIRST_VISIT_KANTEI_PROCEED_READY_CARD } from "@/lib/onboarding/firstVisitWizard/cards";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import type { FirstVisitReadyBranch } from "@/lib/viewer/firstVisitReadyContext";
import { OwlLoadingPanel } from "@/components/ui/OwlLoadingPanel";

/** 第4幕：ログイン済み・未鑑定ユーザー向け */
export function FirstVisitKanteiReadyPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useFirebaseAuth();
  const isLoggedIn = Boolean(user?.email?.trim());
  const [redirecting, setRedirecting] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!isLoggedIn) {
      router.replace(FIRST_VISIT_ROUTES.register);
      return;
    }

    let cancelled = false;

    void fetch("/api/viewer/first-visit-ready-context", { credentials: "same-origin" })
      .then(async (res) => {
        if (!res.ok) throw new Error("context fetch failed");
        return (await res.json()) as { branch: FirstVisitReadyBranch };
      })
      .then((data) => {
        if (cancelled) return;
        if (data.branch === "guest") {
          router.replace(FIRST_VISIT_ROUTES.register);
          return;
        }
        if (data.branch === "hasKantei") {
          router.replace(FIRST_VISIT_ROUTES.alreadyReady);
          return;
        }
        setRedirecting(false);
      })
      .catch(() => {
        if (!cancelled) setRedirecting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, isLoggedIn, router]);

  const handleAction = useCallback(
    (action: FirstVisitGuideCardAction, cardId: string) => {
      if (action === "next" && cardId === "kantei-proceed-ready") {
        router.push(FIRST_VISIT_ROUTES.kantei);
      }
    },
    [router],
  );

  if (authLoading || redirecting || !isLoggedIn) {
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
      stepLabel="鑑定のやかたへ"
      ariaLabel="鑑定のやかたへの案内"
      backHref={FIRST_VISIT_ROUTES.ready}
    >
      <FirstVisitGuideCardPanel
        card={FIRST_VISIT_KANTEI_PROCEED_READY_CARD}
        onAction={handleAction}
      />
    </FirstVisitGuideCardPageLayout>
  );
}
