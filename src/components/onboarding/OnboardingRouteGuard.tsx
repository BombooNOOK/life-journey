"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useOnboardingStage } from "@/components/onboarding/OnboardingStageProvider";
import { isPathAllowedForStage } from "@/lib/onboarding/onboardingStage";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import { readFirstVisitChapterCompleteFlag } from "@/lib/onboarding/firstVisitWizard/session";

/** 段階に合わない URL へ入ったら道しるべへ戻す */
export function OnboardingRouteGuard() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { ready, stage, isComplete } = useOnboardingStage();

  useEffect(() => {
    if (!ready || isComplete) return;
    if (pathname.startsWith("/guide/first")) return;
    if (pathname.startsWith("/help")) return;
    if (pathname.startsWith("/login")) return;
    if (pathname === "/") return;
    if (
      pathname.includes("/read") &&
      (searchParams.get("guide") === "life-path-first" ||
        readFirstVisitChapterCompleteFlag(2))
    ) {
      return;
    }

    if (!isPathAllowedForStage(pathname, stage)) {
      router.replace(FIRST_VISIT_ROUTES.pathGuide);
    }
  }, [isComplete, pathname, ready, router, searchParams, stage]);

  return null;
}
