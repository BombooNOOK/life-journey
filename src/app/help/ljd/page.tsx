import type { Metadata } from "next";
import Link from "next/link";

import { ForestGuideStationHeader } from "@/components/help/ForestGuideStationHeader";
import { ForestGuideStationInteractiveSections } from "@/components/help/ForestGuideStationInteractiveSections";
import { FOREST_GUIDE_STATION_TITLE } from "@/lib/help/forestGuideStation";
import { resolveForestGuideStationBackLink } from "@/lib/help/forestGuideStationNav";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: FOREST_GUIDE_STATION_TITLE,
};

type Props = {
  searchParams: Promise<{ returnTo?: string }>;
};

export default async function HelpLjdWalkthroughPage({ searchParams }: Props) {
  const params = await searchParams;
  const backLink = resolveForestGuideStationBackLink(params.returnTo);

  return (
    <div className="home-read-scope space-y-6">
      {backLink ? (
        <p>
          <Link
            href={backLink.href}
            className="text-sm font-medium text-emerald-900 underline-offset-2 hover:underline"
          >
            ← {backLink.label}
          </Link>
        </p>
      ) : null}

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

      {backLink ? (
        <div className="sticky bottom-3 z-20">
          <Link
            href={backLink.href}
            className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-emerald-300/90 bg-[#fffdf9]/95 px-4 py-3 text-sm font-medium text-emerald-950 shadow-lg backdrop-blur-[2px]"
          >
            ← {backLink.label}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
