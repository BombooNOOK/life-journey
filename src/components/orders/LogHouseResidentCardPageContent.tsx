"use client";

import { ForestResidentAvatarChangePanel } from "@/components/orders/ForestResidentAvatarChangePanel";
import { ForestResidentCardExpandable } from "@/components/orders/ForestResidentCardExpandable";
import { ForestResidentDisplayNameEditor } from "@/components/orders/ForestResidentDisplayNameEditor";
import type { ForestResidentCardData } from "@/lib/forestResident/forestResidentNumber";

type Props = {
  initialCard: ForestResidentCardData;
};

/** 森の住民票・単独ページ本文 */
export function LogHouseResidentCardPageContent({ initialCard }: Props) {
  return (
    <div className="space-y-4">
      <ForestResidentCardExpandable card={initialCard} />

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
            key={initialCard.displayName}
            initialDisplayName={initialCard.displayName}
          />
        </div>
      </details>
    </div>
  );
}
