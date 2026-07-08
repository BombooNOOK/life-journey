"use client";

import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const HINT_VISIBLE_MS = 4000;
/** popstate 直後の pathname 更新では stay を上書きしない */
const POPSTATE_GUARD_MS = 500;

function currentAppPath(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function restoreStayPath(stay: string): void {
  try {
    window.history.replaceState({ ljdBrowserBackTrap: "anchor" }, "", stay);
    window.history.pushState({ ljdBrowserBackTrap: true }, "", stay);
  } catch {
    /* noop */
  }
}

/**
 * iOS Safari などのスワイプ戻り（popstate）を無効化する。
 * 試みたときは blockedHintOpen=true を返し、画面は stayPath に留める。
 */
export function useBlockBrowserBack(enabled = true): {
  blockedHintOpen: boolean;
  dismissBlockedHint: () => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const [blockedHintOpen, setBlockedHintOpen] = useState(false);
  const hintTimerRef = useRef<number | undefined>(undefined);
  const enabledRef = useRef(enabled);
  const stayPathRef = useRef("");
  const lastPopstateAtRef = useRef(0);
  const handlingPopstateRef = useRef(false);

  enabledRef.current = enabled;

  useLayoutEffect(() => {
    if (!enabled) return;
    if (Date.now() - lastPopstateAtRef.current < POPSTATE_GUARD_MS) return;
    stayPathRef.current = currentAppPath();
  }, [enabled, pathname]);

  const dismissBlockedHint = useCallback(() => {
    setBlockedHintOpen(false);
    if (hintTimerRef.current != null) {
      window.clearTimeout(hintTimerRef.current);
      hintTimerRef.current = undefined;
    }
  }, []);

  useLayoutEffect(() => {
    if (!enabled) {
      dismissBlockedHint();
      return;
    }

    stayPathRef.current = currentAppPath();
    restoreStayPath(stayPathRef.current);
  }, [enabled, dismissBlockedHint]);

  useEffect(() => {
    if (!enabled) return;

    const showBlockedHint = () => {
      setBlockedHintOpen(true);
      if (hintTimerRef.current != null) {
        window.clearTimeout(hintTimerRef.current);
      }
      hintTimerRef.current = window.setTimeout(() => {
        setBlockedHintOpen(false);
        hintTimerRef.current = undefined;
      }, HINT_VISIBLE_MS);
    };

    const onPopState = () => {
      if (!enabledRef.current || handlingPopstateRef.current) return;

      handlingPopstateRef.current = true;
      lastPopstateAtRef.current = Date.now();

      const stay = stayPathRef.current || currentAppPath();

      restoreStayPath(stay);

      const route = stay.split("#")[0] ?? stay;
      try {
        router.replace(route);
      } catch {
        /* noop */
      }

      showBlockedHint();

      window.setTimeout(() => {
        handlingPopstateRef.current = false;
      }, 0);
    };

    const onPageShow = (event: PageTransitionEvent) => {
      if (!enabledRef.current || !event.persisted) return;
      stayPathRef.current = currentAppPath();
      restoreStayPath(stayPathRef.current);
    };

    window.addEventListener("popstate", onPopState, true);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("popstate", onPopState, true);
      window.removeEventListener("pageshow", onPageShow);
      if (hintTimerRef.current != null) {
        window.clearTimeout(hintTimerRef.current);
      }
    };
  }, [enabled, router]);

  return { blockedHintOpen, dismissBlockedHint };
}

/** 住民登録〜住民票発行のあいだ、履歴の先頭を固定する */
export function pinFirstVisitRegistrationHistory(): void {
  if (typeof window === "undefined") return;
  const stay = currentAppPath();
  window.history.replaceState({ ljdFirstVisitRegistrationPin: true }, "", stay);
  window.history.pushState({ ljdBrowserBackTrap: true }, "", stay);
  window.history.pushState({ ljdBrowserBackTrap: true }, "", stay);
}
