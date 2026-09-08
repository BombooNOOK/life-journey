"use client";

import { useEffect, useRef, useState } from "react";

import { ForestResidentAvatarChangePanel } from "@/components/orders/ForestResidentAvatarChangePanel";
import { ForestResidentCardExpandable } from "@/components/orders/ForestResidentCardExpandable";
import { ForestResidentDisplayNameEditor } from "@/components/orders/ForestResidentDisplayNameEditor";
import type { ForestResidentCardData } from "@/lib/forestResident/forestResidentNumber";

type Props = {
  initialCard: ForestResidentCardData;
};

/**
 * 森の住民票・単独ページ本文.
 *
 * AI-X6.7C1.5A2-I3.6 — After actual mount, POST provisions welcome gift
 * (idempotent). SSR GET must not award welcome_gift.
 */
export function LogHouseResidentCardPageContent({ initialCard }: Props) {
  const [card, setCard] = useState(initialCard);
  const started = useRef(false);

  useEffect(() => {
    setCard(initialCard);
  }, [initialCard]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let cancelled = false;
    void fetch("/api/viewer/forest-resident-card", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) return;
        return (await res.json()) as { card?: ForestResidentCardData };
      })
      .then((data) => {
        if (!cancelled && data?.card) setCard(data.card);
      })
      .catch(() => {
        // Keep SSR card; welcome remains idempotent on next visit.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <ForestResidentCardExpandable card={card} />

      <ForestResidentAvatarChangePanel />

      <details className="group rounded-lg border border-stone-200/80 bg-white">
        <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-medium text-stone-700 marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between gap-2">
            <span>住民票のおなまえを変更</span>
            <span
              className="text-xs font-normal text-stone-500 transition-transform group-open:rotate-180"
              aria-hidden
            >
              ▼
            </span>
          </span>
        </summary>
        <div className="border-t border-stone-100 px-3 pb-3 pt-3">
          <ForestResidentDisplayNameEditor
            key={card.displayName}
            initialDisplayName={card.displayName}
          />
        </div>
      </details>
    </div>
  );
}
