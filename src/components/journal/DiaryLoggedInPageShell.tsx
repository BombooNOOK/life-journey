"use client";

import { Suspense } from "react";

import { OnboardingNextStepBanner } from "@/components/onboarding/OnboardingNextStepBanner";
import { OnboardingRouteGuard } from "@/components/onboarding/OnboardingRouteGuard";
import { DiaryHomeBottomNav } from "@/components/journal/DiaryHomeBottomNav";

type Props = {
  children: React.ReactNode;
};

/** 下部メニュー分の余白 + 固定ナビ + オンボーディング案内 */
export function DiaryLoggedInPageShell({ children }: Props) {
  return (
    <div className="pb-24">
      <Suspense fallback={null}>
        <OnboardingRouteGuard />
      </Suspense>
      <OnboardingNextStepBanner />
      {children}
      <DiaryHomeBottomNav />
    </div>
  );
}
