"use client";

import { ForestResidentCard } from "@/components/guide/ForestResidentCard";
import { ForestResidentDisplayNameEditor } from "@/components/orders/ForestResidentDisplayNameEditor";
import type { ForestResidentCardData } from "@/lib/forestResident/forestResidentNumber";

type Props = {
  initialCard: ForestResidentCardData;
};

/** ログハウス：森の住民票 */
export function LogHouseResidentCardSection({ initialCard }: Props) {
  return (
    <section
      className="rounded-2xl border border-emerald-100/90 bg-gradient-to-br from-emerald-50/60 via-white to-amber-50/30 p-4 shadow-sm sm:p-5"
      aria-labelledby="loghouse-resident-card-heading"
    >
      <div className="space-y-1">
        <h2 id="loghouse-resident-card-heading" className="text-lg font-semibold text-stone-900">
          森の住民票
        </h2>
        <p className="text-sm leading-relaxed text-stone-600">
          あなたの森の住民としてのカードです。おなまえの変更は下のメニューからできます。
        </p>
      </div>

      <div className="mt-4 flex justify-center">
        <div className="w-full max-w-[16rem]">
          <ForestResidentCard {...initialCard} />
        </div>
      </div>

      <details className="group mt-4 rounded-lg border border-stone-200/80 bg-white/70">
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
    </section>
  );
}
