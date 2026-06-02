"use client";

import { useEffect, useRef, useState } from "react";

/** キーボード表示時の visualViewport 下端インセット（px）。デバッグ・他UI用 */
export function useKeyboardBottomInset(enabled: boolean): number {
  const [inset, setInset] = useState(0);
  const insetRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      insetRef.current = 0;
      setInset(0);
      return;
    }

    const commit = () => {
      const vv = window.visualViewport;
      const next = vv
        ? Math.round(Math.max(0, window.innerHeight - vv.offsetTop - vv.height))
        : 0;
      if (next === insetRef.current) return;
      insetRef.current = next;
      setInset(next);
    };

    commit();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", commit);
    window.addEventListener("resize", commit);

    return () => {
      vv?.removeEventListener("resize", commit);
      window.removeEventListener("resize", commit);
    };
  }, [enabled]);

  return inset;
}
