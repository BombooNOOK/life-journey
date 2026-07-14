"use client";

import { TransitionNavigationProvider } from "@/components/ui/TransitionNavigationProvider";
import { BambooForestGuideMap } from "@/components/help/BambooForestGuideMap";
import { LjdFirstVisitFlowCard } from "@/components/help/LjdFirstVisitFlowCard";
import { LjdWalkthroughToc } from "@/components/help/LjdWalkthroughToc";
import {
  FOREST_GUIDE_STATION_MAP_SECTION_TITLE,
} from "@/lib/help/forestGuideStation";
import { FOREST_GUIDE_MAP_SECTION_HINT } from "@/lib/help/bambooForestGuideMapBuildings";

/** 森の案内所：マップ・目次（遷移時の遅延フクロウ付き） */
export function ForestGuideStationInteractiveSections() {
  return (
    <TransitionNavigationProvider message={null}>
      <div className="space-y-6">
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

      <LjdFirstVisitFlowCard />

      <div className="relative z-10">
        <LjdWalkthroughToc />
      </div>
      </div>
    </TransitionNavigationProvider>
  );
}
