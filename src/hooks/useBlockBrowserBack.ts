"use client";

import { useEffect } from "react";

/**
 * iOS Safari などのスワイプ戻り（popstate）を無効化する。
 * はじめての方導線では画面内の戻るボタンのみで遷移させる。
 */
export function useBlockBrowserBack(enabled = true): void {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const trap = () => {
      window.history.pushState({ ljdBrowserBackTrap: true }, "", window.location.href);
    };

    const arm = () => {
      trap();
      trap();
    };

    arm();

    const onPopState = () => {
      arm();
    };

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        arm();
      }
    };

    window.addEventListener("popstate", onPopState);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [enabled]);
}

/** 住民登録〜住民票発行のあいだ、履歴の先頭を resident-card に固定する */
export function pinFirstVisitRegistrationHistory(): void {
  if (typeof window === "undefined") return;
  window.history.replaceState({ ljdFirstVisitRegistrationPin: true }, "", window.location.href);
  window.history.pushState({ ljdBrowserBackTrap: true }, "", window.location.href);
}
