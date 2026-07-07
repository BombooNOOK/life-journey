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

    trap();
    window.addEventListener("popstate", trap);
    return () => window.removeEventListener("popstate", trap);
  }, [enabled]);
}
