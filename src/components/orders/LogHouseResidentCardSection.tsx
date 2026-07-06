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
          あなたの森の住民としてのカードです。おなまえはここで変更できます。
        </p>
      </div>

      <div className="mt-4 flex flex-col items-center gap-4 lg:flex-row lg:items-start lg:gap-6">
        <div className="w-full max-w-[16rem] shrink-0">
          <ForestResidentCard {...initialCard} />
        </div>
        <div className="w-full flex-1 pt-1">
          <ForestResidentDisplayNameEditor
            key={initialCard.displayName}
            initialDisplayName={initialCard.displayName}
          />
        </div>
      </div>
    </section>
  );
}
