"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

import { pinFirstVisitWizardHistory } from "@/hooks/useBlockBrowserBack";
import { isFirstVisitSwipeBackAllowed } from "@/lib/onboarding/firstVisitWizard/backBlockPolicy";

/** 初回導線レイアウト：マウント時に履歴を固定しスワイプ戻りの逃げ道を減らす */
export function FirstVisitWizardHistoryPin() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (isFirstVisitSwipeBackAllowed(pathname)) return;
    pinFirstVisitWizardHistory();
  }, [pathname]);

  return null;
}
