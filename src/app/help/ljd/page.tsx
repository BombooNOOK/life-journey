import type { Metadata } from "next";
import Link from "next/link";

import { BambooForestGuideMap } from "@/components/help/BambooForestGuideMap";
import { ForestGuideStationHeader } from "@/components/help/ForestGuideStationHeader";
import { LjdFirstVisitFlowSteps } from "@/components/help/LjdFirstVisitFlowSteps";
import { LjdWalkthroughToc } from "@/components/help/LjdWalkthroughToc";
import { FOREST_GUIDE_STATION_MAP_SECTION_TITLE, FOREST_GUIDE_STATION_TITLE } from "@/lib/help/forestGuideStation";
import { FOREST_GUIDE_MAP_SECTION_HINT } from "@/lib/help/bambooForestGuideMapBuildings";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: FOREST_GUIDE_STATION_TITLE,
};

export default function HelpLjdWalkthroughPage() {
  return (
    <div className="home-read-scope space-y-6">
      <ForestGuideStationHeader />

      <section aria-labelledby="forest-guide-map-heading" className="space-y-3">
        <div>
          <h2
            id="forest-guide-map-heading"
            className="text-base font-semibold text-stone-900 sm:text-lg"
          >
            {FOREST_GUIDE_STATION_MAP_SECTION_TITLE}
          </h2>
          <p className="mt-1 text-sm leading-6 text-stone-600">{FOREST_GUIDE_MAP_SECTION_HINT}</p>
        </div>
        <BambooForestGuideMap />
      </section>

      <LjdFirstVisitFlowSteps />

      <LjdWalkthroughToc />

      <div className="rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-600">
        <p>
          画面操作の手順（無料鑑定 → 本棚 → 日記 → 製本）は
          <Link href="/guide" className="mx-1 font-medium text-emerald-900 underline-offset-2 hover:underline">
            使い方
          </Link>
          にまとめています。
        </p>
      </div>
    </div>
  );
}
