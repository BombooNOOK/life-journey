"use client";

import { useLayoutEffect } from "react";

import { pinFirstVisitWizardHistory } from "@/hooks/useBlockBrowserBack";

/** 初回導線レイアウト：マウント時に履歴を固定しスワイプ戻りの逃げ道を減らす */
export function FirstVisitWizardHistoryPin() {
  useLayoutEffect(() => {
    pinFirstVisitWizardHistory();
  }, []);

  return null;
}
