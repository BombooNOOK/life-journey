"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { isLjLoggedInOnClient } from "@/lib/auth/clientCookies";
import { readFirstVisitProgressStage } from "@/lib/onboarding/firstVisitWizard/progress";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import { resolveFirstVisitResumeHref } from "@/lib/onboarding/firstVisitWizard/resumeNavigation";
import {
  readBookshelfKanteiGuideFlag,
  readFirstVisitFromRegisterFlag,
  readFirstVisitOrderGuideFlag,
} from "@/lib/onboarding/firstVisitWizard/session";
import type { FirstVisitReadyBranch } from "@/lib/viewer/firstVisitReadyContext";

/** ログイン済みで welcome に来たとき、保存済みの続きへ誘導 */
export function FirstVisitResumeRedirect() {
  const router = useRouter();
  const { user, loading: authLoading } = useFirebaseAuth();

  useEffect(() => {
    if (authLoading) return;
    const loggedIn = Boolean(user?.email?.trim()) || isLjLoggedInOnClient();
    if (!loggedIn) return;

    let cancelled = false;

    void fetch("/api/viewer/first-visit-ready-context", { credentials: "same-origin" })
      .then(async (res) => {
        if (!res.ok) throw new Error("context fetch failed");
        return (await res.json()) as { branch: FirstVisitReadyBranch };
      })
      .then((data) => {
        if (cancelled) return;
        const href = resolveFirstVisitResumeHref({
          branch: data.branch,
          savedStage: readFirstVisitProgressStage(),
          bookshelfKanteiGuide: readBookshelfKanteiGuideFlag(),
          orderGuide: readFirstVisitOrderGuideFlag(),
          fromRegisterHandoff: readFirstVisitFromRegisterFlag(),
        });
        if (href !== FIRST_VISIT_ROUTES.pathGuide) {
          router.replace(href);
        }
      })
      .catch(() => {
        /* welcome のまま */
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, router, user]);

  return null;
}
