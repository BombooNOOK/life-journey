"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";

import { DiaryHomeBottomNav } from "@/components/journal/DiaryHomeBottomNav";
import { OnboardingNextStepBanner } from "@/components/onboarding/OnboardingNextStepBanner";
import { OnboardingRouteGuard } from "@/components/onboarding/OnboardingRouteGuard";
import {
  isLogHouseImmersivePath,
  useIsLogHouseMobileViewport,
} from "@/lib/loghouse/logHouseViewport";

type Props = {
  children: React.ReactNode;
};

/** 下部メニュー分の余白 + 固定ナビ + オンボーディング案内（スマホログハウスは没入のため非表示） */
export function DiaryLoggedInPageShell({ children }: Props) {
  const pathname = usePathname();
  const isMobile = useIsLogHouseMobileViewport();
  const immersiveLogHouse = isLogHouseImmersivePath(pathname) && isMobile;

  return (
    <div className={immersiveLogHouse ? "" : "pb-24"}>
      <Suspense fallback={null}>
        <OnboardingRouteGuard />
      </Suspense>
      {immersiveLogHouse ? null : <OnboardingNextStepBanner />}
      {children}
      {immersiveLogHouse ? null : <DiaryHomeBottomNav />}
    </div>
  );
}
