"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { FirstVisitGuideCardPageLayout } from "@/components/guide/first-visit/FirstVisitGuideCardPageLayout";
import { FirstVisitGuideCardPanel } from "@/components/guide/first-visit/FirstVisitGuideCardStack";
import type { FirstVisitGuideCardAction } from "@/lib/onboarding/firstVisitWizard/cards";
import { FIRST_VISIT_ALREADY_READY_CARD } from "@/lib/onboarding/firstVisitWizard/cards";
import { firstVisitReadyNextHref } from "@/lib/onboarding/firstVisitWizard/readyNavigation";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import type { FirstVisitReadyBranch } from "@/lib/viewer/firstVisitReadyContext";
import { OwlLoadingPanel } from "@/components/ui/OwlLoadingPanel";

/** 第4幕：住民登録・鑑定済みユーザー向け */
export function FirstVisitAlreadyReadyPage() {
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
        if (data.branch !== "hasKantei") {
          router.replace(firstVisitReadyNextHref(data.branch));
          return;
        }
        setRedirecting(false);
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
      if (action === "orders") {
        router.push("/orders");
        return;
      }

      if (action === "home") {
        router.push("/");
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
      stepLabel="鑑定のやかた"
      ariaLabel="鑑定済みの案内"
      backHref={FIRST_VISIT_ROUTES.ready}
    >
      <FirstVisitGuideCardPanel card={FIRST_VISIT_ALREADY_READY_CARD} onAction={handleAction} />
    </FirstVisitGuideCardPageLayout>
  );
}
