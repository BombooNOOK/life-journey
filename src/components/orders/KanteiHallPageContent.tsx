import Link from "next/link";

import { ForestBuildingIllustration } from "@/components/guide/first-visit/ForestBuildingIllustration";
import {
  KANTEI_HALL_BOOKSHELF_HINT,
  KANTEI_HALL_CORE_SECTION_TITLE,
  KANTEI_HALL_PAGE_DESCRIPTION,
  KANTEI_HALL_PAGE_TITLE,
  KANTEI_HALL_PERSONAL_MONTH_SECTION_TITLE,
  KANTEI_HALL_PERSONAL_YEAR_SECTION_TITLE,
} from "@/lib/kantei/kanteiHallCopy";
import type { KanteiHallNumberRow, KanteiHallSummary } from "@/lib/kantei/kanteiHallSummary";
import { FOREST_MAP_KANTEI_BOOKSHELF_HREF } from "@/lib/help/forestGuideMapKanteiHallLink";
import { LOG_HOUSE_BACK_LINK } from "@/lib/journal/logHouseLabels";

type Props = {
  summary: KanteiHallSummary;
  backHref?: string;
  backLabel?: string;
};

function NumberMessageCard({ row }: { row: KanteiHallNumberRow }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-stone-500">
            {row.yearLabel ? `${row.yearLabel}・${row.label}` : row.label}
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-700">{row.message}</p>
        </div>
        <p className="shrink-0 text-3xl font-semibold tabular-nums leading-none text-stone-900">
          {row.value ?? "—"}
        </p>
      </div>
    </div>
  );
}

/** 鑑定のへや（鑑定後）：建物イラスト＋数字の読み返し */
export function KanteiHallPageContent({
  summary,
  backHref = "/orders",
  backLabel = LOG_HOUSE_BACK_LINK.label,
}: Props) {
  return (
    <div className="home-read-scope space-y-6">
      <header className="space-y-4">
        <p>
          <Link
            href={backHref}
            className="text-sm text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline"
          >
            {backLabel}
          </Link>
        </p>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
            {KANTEI_HALL_PAGE_TITLE}
          </h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">{KANTEI_HALL_PAGE_DESCRIPTION}</p>
        </div>
        <ForestBuildingIllustration building="kanteiHall" alt="鑑定のへやの建物" className="pt-1" />
      </header>

      <section
        aria-labelledby="kantei-hall-core-heading"
        className="scroll-mt-6 space-y-3 rounded-2xl border border-amber-100 bg-gradient-to-br from-white to-amber-50/70 p-5 shadow-sm"
      >
        <h2 id="kantei-hall-core-heading" className="text-lg font-semibold text-stone-900">
          {KANTEI_HALL_CORE_SECTION_TITLE}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {summary.coreRows.map((row) => (
            <NumberMessageCard key={row.id} row={row} />
          ))}
          <NumberMessageCard row={summary.maturityRow} />
        </div>
      </section>

      <section
        aria-labelledby="kantei-hall-year-heading"
        className="scroll-mt-6 space-y-3 rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
      >
        <h2 id="kantei-hall-year-heading" className="text-lg font-semibold text-stone-900">
          {KANTEI_HALL_PERSONAL_YEAR_SECTION_TITLE}
        </h2>
        <NumberMessageCard row={summary.personalYearRow} />
      </section>

      <section
        aria-labelledby="kantei-hall-month-heading"
        className="scroll-mt-6 space-y-3 rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
      >
        <h2 id="kantei-hall-month-heading" className="text-lg font-semibold text-stone-900">
          {KANTEI_HALL_PERSONAL_MONTH_SECTION_TITLE}
        </h2>
        <NumberMessageCard row={summary.personalMonthRow} />
      </section>

      <p className="rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm leading-6 text-stone-600">
        {KANTEI_HALL_BOOKSHELF_HINT}{" "}
        <Link
          href={FOREST_MAP_KANTEI_BOOKSHELF_HREF}
          className="font-medium text-emerald-900 underline-offset-2 hover:underline"
        >
          本棚を開く
        </Link>
      </p>
    </div>
  );
}
