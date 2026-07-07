"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { OwlLoadingPanel } from "@/components/ui/OwlLoadingPanel";
import { firstVisitReadyNextHref } from "@/lib/onboarding/firstVisitWizard/readyNavigation";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import type { FirstVisitReadyBranch } from "@/lib/viewer/firstVisitReadyContext";

/** 旧URL保険：/guide/first/ready から現行導線へ転送 */
export function FirstVisitReadyPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useFirebaseAuth();
  const isLoggedIn = Boolean(user?.email?.trim());

  useEffect(() => {
    if (authLoading) return;

    if (!isLoggedIn) {
      router.replace(FIRST_VISIT_ROUTES.guideStationSign);
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
        router.replace(firstVisitReadyNextHref(data.branch));
      })
      .catch(() => {
        if (!cancelled) router.replace(FIRST_VISIT_ROUTES.residentCard);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, isLoggedIn, router]);

  return (
    <OwlLoadingPanel
      layout="page"
      label="案内を読み込んでいます…"
      hint="フクロウが回っているあいだはそのままお待ちください。"
    />
  );
}
