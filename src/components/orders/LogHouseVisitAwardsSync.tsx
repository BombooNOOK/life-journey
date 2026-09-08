"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * AI-X6.7C1.5A2-I3.6 — After actual browser mount of /orders, POST visit awards.
 *
 * RSC / prefetch / GET render must not award. Only this client mount path may.
 * Idempotent server-side (one daily per dateKey).
 */
export function LogHouseVisitAwardsSync() {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let cancelled = false;
    void fetch("/api/loghouse/donguri/visit-awards", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as {
          dailyDelivered?: boolean;
          birthdayDelivered?: boolean;
        };
        if (json.dailyDelivered || json.birthdayDelivered) {
          router.refresh();
        }
      })
      .catch(() => {
        // Keep SSR read model; awards remain idempotent on next visit.
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
