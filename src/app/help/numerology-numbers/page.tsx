import type { Metadata } from "next";
import Link from "next/link";

import { NumerologyNumbersDictionaryView } from "@/components/journal/NumerologyNumbersDictionaryView";
import { NUMEROLOGY_NUMBERS_PAGE_TITLE } from "@/lib/journal/numerologyNumberMeanings";
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
      <Link href={backLink.href} className="text-sm text-stone-600 hover:text-stone-900">
        ← {backLink.label}
      </Link>
      <NumerologyNumbersDictionaryView />
    </div>
  );
}
