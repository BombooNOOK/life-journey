import { cookies } from "next/headers";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import {
  resolveOnboardingNextStep,
  resolveOnboardingStage,
  type OnboardingStage,
} from "@/lib/onboarding/onboardingStage";
import { ONBOARDING_CHAPTER1_COMPLETE_COOKIE, ONBOARDING_CHAPTER2_COMPLETE_COOKIE } from "@/lib/onboarding/onboardingStageCookies";
import { resolveFirstVisitReadyContext } from "@/lib/viewer/firstVisitReadyContext";

export type OnboardingStageContext = {
  isLoggedIn: boolean;
  stage: OnboardingStage;
  chapter1Complete: boolean;
  hasKanteiOrder: boolean;
  journalEntryCount: number;
  nextStep: ReturnType<typeof resolveOnboardingNextStep>;
};

export async function resolveOnboardingStageContext(
  viewerEmail: string | null | undefined,
): Promise<OnboardingStageContext> {
  const isLoggedIn = Boolean(viewerEmail?.trim());
  if (!isLoggedIn) {
    const stage = 0;
    return {
      isLoggedIn: false,
      stage,
      chapter1Complete: false,
      hasKanteiOrder: false,
      journalEntryCount: 0,
      nextStep: resolveOnboardingNextStep(stage),
    };
  }

  const ready = await resolveFirstVisitReadyContext(viewerEmail);
  const cookieStore = await cookies();
  const chapter1FromCookie =
    cookieStore.get(ONBOARDING_CHAPTER1_COMPLETE_COOKIE)?.value === "1";
  const hasKanteiOrder = ready.branch === "hasKantei";
  const chapter2FromCookie =
    cookieStore.get(ONBOARDING_CHAPTER2_COMPLETE_COOKIE)?.value === "1";
  const chapter1Complete = chapter1FromCookie || hasKanteiOrder || chapter2FromCookie;

  const stage = resolveOnboardingStage({
    isLoggedIn: true,
    chapter1Complete,
    hasKanteiOrder,
    journalEntryCount: ready.journalEntryCount,
  });

  return {
    isLoggedIn: true,
    stage,
    chapter1Complete,
    hasKanteiOrder,
    journalEntryCount: ready.journalEntryCount,
    nextStep: resolveOnboardingNextStep(stage),
  };
}

export async function resolveOnboardingStageContextFromCookie(): Promise<OnboardingStageContext> {
  const viewerEmail = await getViewerEmailFromCookie();
  return resolveOnboardingStageContext(viewerEmail);
}
