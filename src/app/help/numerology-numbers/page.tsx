import type { Metadata } from "next";
import Link from "next/link";

import {
  NUMEROLOGY_NUMBER_MEANING_ENTRIES,
  NUMEROLOGY_NUMBER_PLACEHOLDER_LABEL,
  NUMEROLOGY_NUMBERS_PAGE_COMING_SOON,
  NUMEROLOGY_NUMBERS_PAGE_FOOTNOTE,
  NUMEROLOGY_NUMBERS_PAGE_INTRO,
  NUMEROLOGY_NUMBERS_PAGE_TITLE,
} from "@/lib/journal/numerologyNumberMeanings";
import {
  numerologyNumbersBackLink,
  parseSafeNumerologyNumbersReturnTo,
} from "@/lib/journal/numerologyNumbersNav";

export const metadata: Metadata = {
  title: NUMEROLOGY_NUMBERS_PAGE_TITLE,
};

type Props = {
  searchParams: Promise<{ returnTo?: string }>;
};

export default async function NumerologyNumbersHelpPage({ searchParams }: Props) {
  const params = await searchParams;
  const safeReturnTo = parseSafeNumerologyNumbersReturnTo(params.returnTo);
  const backLink = numerologyNumbersBackLink(safeReturnTo);

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-8">
      <div>
        <Link href={backLink.href} className="text-sm text-stone-600 hover:text-stone-900">
          ← {backLink.label}
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-stone-900">{NUMEROLOGY_NUMBERS_PAGE_TITLE}</h1>
        <p className="mt-3 text-base leading-relaxed text-stone-700">{NUMEROLOGY_NUMBERS_PAGE_INTRO}</p>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">{NUMEROLOGY_NUMBERS_PAGE_COMING_SOON}</p>
      </div>

      <section aria-labelledby="numerology-numbers-list-heading" className="space-y-3">
        <h2 id="numerology-numbers-list-heading" className="text-base font-semibold text-stone-900">
          数字一覧
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {NUMEROLOGY_NUMBER_MEANING_ENTRIES.map((entry) => (
            <li
              key={entry.value}
              className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm"
            >
              <p className="text-lg font-semibold text-stone-900">{entry.display}</p>
              <p className="mt-1 text-sm leading-relaxed text-stone-600">
                {entry.theme ?? NUMEROLOGY_NUMBER_PLACEHOLDER_LABEL}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm leading-relaxed text-stone-600">{NUMEROLOGY_NUMBERS_PAGE_FOOTNOTE}</p>
    </div>
  );
}
