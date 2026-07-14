"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";

import { DiaryHomeBottomNav } from "@/components/journal/DiaryHomeBottomNav";
import { OnboardingNextStepBanner } from "@/components/onboarding/OnboardingNextStepBanner";
import { OnboardingRouteGuard } from "@/components/onboarding/OnboardingRouteGuard";
import { LJD_PAGE_BG_CLASS } from "@/lib/ljd/ljdPaperSurface";
import {
  isLogHouseImmersivePath,
  useIsLogHouseMobileViewport,
} from "@/lib/loghouse/logHouseViewport";

type Props = {
  children: React.ReactNode;
};

/** 日記まわり（半没入紙トーン）に生成り背景を当てる。ログハウス／お庭などは対象外 */
function isDiaryPaperPath(pathname: string): boolean {
  if (pathname.startsWith("/journal/with-companion")) return false;
  if (pathname.startsWith("/journal")) return true;
  if (pathname.startsWith("/orders/calendar")) return true;
  if (pathname.startsWith("/orders/list")) return true;
  if (pathname.startsWith("/orders/write")) return true;
  if (pathname.startsWith("/orders/bookshelf")) return true;
  return false;
}

/** 下部メニュー分の余白 + 固定ナビ + オンボーディング案内（スマホログハウスは没入のため非表示） */
export function DiaryLoggedInPageShell({ children }: Props) {
  const pathname = usePathname();
  const isMobile = useIsLogHouseMobileViewport();
  const immersiveLogHouse = isLogHouseImmersivePath(pathname) && isMobile;
  const onCompanionWriting = pathname.startsWith("/journal/with-companion");
  const hideChrome = immersiveLogHouse || onCompanionWriting;
  const diaryPaper = isDiaryPaperPath(pathname);

  return (
    <div
      className={[
        immersiveLogHouse ? "" : "pb-24",
        diaryPaper ? LJD_PAGE_BG_CLASS : "",
        diaryPaper ? "min-h-[100dvh]" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Suspense fallback={null}>
        <OnboardingRouteGuard />
      </Suspense>
      {hideChrome ? null : <OnboardingNextStepBanner />}
      {children}
      {immersiveLogHouse ? null : <DiaryHomeBottomNav />}
    </div>
  );
}
