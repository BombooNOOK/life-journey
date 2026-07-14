import type { Metadata } from "next";
import Link from "next/link";

import { ForestGuideStationHeader } from "@/components/help/ForestGuideStationHeader";
import { ForestGuideStationInteractiveSections } from "@/components/help/ForestGuideStationInteractiveSections";
import { FOREST_GUIDE_STATION_TITLE } from "@/lib/help/forestGuideStation";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: FOREST_GUIDE_STATION_TITLE,
};

export default function HelpLjdWalkthroughPage() {
  return (
    <div className="home-read-scope space-y-6">
      <ForestGuideStationHeader />

      <ForestGuideStationInteractiveSections />

      <div className="rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-600">
        <p>
          どこを押すか迷ったときは
          <Link href="/guide" className="mx-1 font-medium text-emerald-900 underline-offset-2 hover:underline">
            はじめての操作ヒント
          </Link>
          もご覧ください。
        </p>
      </div>
    </div>
  );
}
