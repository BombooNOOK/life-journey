"use client";

import { useEffect, useState } from "react";

import { DELAYED_BUSY_SPINNER_MS } from "@/lib/ui/delayedBusyConstants";

/**
 * active が delayMs 以上続いたときだけ true。
 * サッと終わる操作ではスピナーを出さない。
 */
export function useDelayedBusy(
  active: boolean,
  delayMs: number = DELAYED_BUSY_SPINNER_MS,
): boolean {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!active) {
      setShow(false);
      return;
    }

    const timer = window.setTimeout(() => setShow(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [active, delayMs]);

  return show;
}
