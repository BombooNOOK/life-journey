import type { Metadata } from "next";
import Link from "next/link";

import { LjdWalkthroughToc } from "@/components/help/LjdWalkthroughToc";
import { PageTitleWithAccent } from "@/components/ui/PageTitleWithAccent";
import { LOG_HOUSE_BACK_LINK, LOG_HOUSE_TAGLINE } from "@/lib/journal/logHouseLabels";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "LJDの歩き方",
};

export default function HelpLjdWalkthroughPage() {
  return (
    <div className="home-read-scope space-y-6">
      <PageTitleWithAccent
        tone="diary"
        decoration="owl-md"
        title="LJDの歩き方"
        backLink={LOG_HOUSE_BACK_LINK}
        description={
          <>
            <p>{LOG_HOUSE_TAGLINE}</p>
            <p className="mt-2">
              必要な項目だけ開いて読める目次です。はじめての方は
              <Link href="/guide/first" className="mx-1 font-medium text-emerald-900 underline-offset-2 hover:underline">
                初めての3分ガイド
              </Link>
              からでも大丈夫です。
            </p>
          </>
        }
      />

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
