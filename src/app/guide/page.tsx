import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { GuestReadingFontSizeBand } from "@/components/reading/GuestReadingFontSizeBand";
import { PageTitleWithAccent } from "@/components/ui/PageTitleWithAccent";
import { SoftIllustrationAccent } from "@/components/ui/SoftIllustrationAccent";
import {
  GUIDE_OPERATION_PAGE_DESCRIPTION,
  GUIDE_OPERATION_PAGE_TITLE,
  GUIDE_OPERATION_STATION_CROSSLINK_HREF,
  GUIDE_OPERATION_STATION_CROSSLINK_LABEL,
  GUIDE_OPERATION_TIPS,
} from "@/lib/guide/operationTipsCopy";
import { LOG_HOUSE_BACK_LINK } from "@/lib/journal/logHouseLabels";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: GUIDE_OPERATION_PAGE_TITLE,
  description: GUIDE_OPERATION_PAGE_DESCRIPTION,
};

function TipCard({
  step,
  title,
  children,
}: {
  step: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="relative overflow-hidden rounded-xl border border-stone-200 bg-white p-4 pr-12 shadow-sm">
      <span
        className="pointer-events-none absolute right-3 top-3 flex h-7 w-7 select-none items-center justify-center rounded-full border border-emerald-100 bg-emerald-50/90 text-xs font-semibold text-emerald-800/70"
        aria-hidden="true"
      >
        {step}
      </span>
      <div className="pointer-events-none absolute bottom-3 right-10 hidden select-none sm:block">
        <SoftIllustrationAccent variant="leaf" size="sm" tone="stone" />
      </div>
      <h2 className="text-sm font-semibold text-stone-900">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-6 text-stone-700">{children}</div>
    </article>
  );
}

export default function GuidePage() {
  return (
    <div className="home-read-scope space-y-6">
      <div id="guide-top" className="scroll-mt-24">
        <PageTitleWithAccent
          tone="guide"
          title={GUIDE_OPERATION_PAGE_TITLE}
          backLink={LOG_HOUSE_BACK_LINK}
          description={GUIDE_OPERATION_PAGE_DESCRIPTION}
          cornerAccents={["book", "leaf"]}
        />
      </div>

      <ol className="space-y-3">
        {GUIDE_OPERATION_TIPS.map((tip, index) => (
          <li key={tip.id}>
            <TipCard step={String(index + 1)} title={`${index + 1}. ${tip.title}`}>
              <p>{tip.body}</p>
              {tip.note ? <p className="text-xs leading-relaxed text-stone-500">{tip.note}</p> : null}
              {tip.link ? (
                <p className="mt-3">
                  <Link
                    href={tip.link.href}
                    className="font-medium text-emerald-900 underline-offset-2 hover:underline"
                  >
                    {tip.link.label} →
                  </Link>
                </p>
              ) : null}
            </TipCard>
          </li>
        ))}
      </ol>

      <div className="relative overflow-hidden rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 via-white to-stone-50/80 p-4 text-sm text-stone-700 shadow-sm">
        <div className="pointer-events-none absolute right-3 top-3 hidden select-none sm:block">
          <SoftIllustrationAccent variant="book" size="sm" tone="emerald" />
        </div>
        <p className="relative z-10 font-medium text-stone-900">もっとくわしく知りたいとき</p>
        <p className="relative z-10 mt-2 leading-6">
          ログハウスやあしあと・本棚の意味や流れは、森の案内所にまとめています。操作で迷ったときの近道がこのページ、世界の歩き方が案内所、という役割分けです。
        </p>
        <p className="relative z-10 mt-3">
          <Link
            href={GUIDE_OPERATION_STATION_CROSSLINK_HREF}
            className="font-medium text-emerald-900 underline-offset-2 hover:underline"
          >
            {GUIDE_OPERATION_STATION_CROSSLINK_LABEL} →
          </Link>
        </p>
      </div>

      <GuestReadingFontSizeBand pageKey="guide" />
    </div>
  );
}
