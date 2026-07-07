"use client";

import { ForestBuildingIllustration } from "@/components/guide/first-visit/ForestBuildingIllustration";
import { InlineHelpButton } from "@/components/ui/InlineHelpButton";
import {
  FOREST_GUIDE_STATION_DESCRIPTION,
  FOREST_GUIDE_STATION_TITLE,
} from "@/lib/help/forestGuideStation";

/** 森の案内所ページ上部（タイトル・説明・建物イラスト） */
export function ForestGuideStationHeader() {
  return (
    <header className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
          {FOREST_GUIDE_STATION_TITLE}
        </h1>
        <InlineHelpButton ariaLabel="森の案内所の説明を表示" panelAlign="start">
          <p className="text-sm leading-relaxed">{FOREST_GUIDE_STATION_DESCRIPTION}</p>
        </InlineHelpButton>
      </div>

      <ForestBuildingIllustration
        building="guideStation"
        alt="森の案内所の建物"
        className="pt-1"
      />
    </header>
  );
}
