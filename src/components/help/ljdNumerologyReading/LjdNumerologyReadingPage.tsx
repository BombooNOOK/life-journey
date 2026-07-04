import Image from "next/image";
import Link from "next/link";

import { NumberGuideAccordionSection } from "@/components/help/ljdNumerologyReading/NumberGuideAccordionSection";
import { NumerologyNumbersDictionaryView } from "@/components/journal/NumerologyNumbersDictionaryView";
import {
  LJD_NUMEROLOGY_READING_BACK_HREF,
  LJD_NUMEROLOGY_READING_BACK_LABEL,
  LJD_NUMEROLOGY_READING_INTRO_PARAGRAPHS,
  LJD_NUMEROLOGY_READING_INTRO_QUOTE,
  LJD_NUMEROLOGY_READING_LEAD,
  LJD_NUMEROLOGY_READING_NUMBER_DETAIL_TITLE,
  LJD_NUMEROLOGY_READING_NUMBER_INDEX_TITLE,
  LJD_NUMEROLOGY_READING_PAGE_TITLE,
  LJD_NUMEROLOGY_READING_THEME_SECTION_TITLE,
} from "@/lib/help/ljdNumerologyReading/introCopy";
import {
  NUMBER_GUIDE_CATEGORIES,
  NUMBER_GUIDE_ENTRIES,
  numberGuideAnchorId,
} from "@/lib/help/ljdNumerologyReading/numberTypeCatalog";
import { NUMEROLOGY_NUMBERS_PAGE_FOOTNOTE } from "@/lib/journal/numerologyNumberMeanings";

const SECTION_HEADING_CLASS =
  "text-xl font-bold tracking-tight text-emerald-950 sm:text-2xl";

const SUBSECTION_HEADING_CLASS = "text-base font-semibold text-stone-800 sm:text-[1.05rem]";

export function LjdNumerologyReadingPage() {
  return (
    <div className="home-read-scope space-y-14 pb-12 sm:space-y-16">
      <Link
        href={LJD_NUMEROLOGY_READING_BACK_HREF}
        className="inline-block text-sm text-stone-600 transition hover:text-stone-900"
      >
        ← {LJD_NUMEROLOGY_READING_BACK_LABEL}
      </Link>

      <header className="space-y-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="lj-reading-exempt shrink-0">
            <Image
              src="/decorations/owl-sensei-my-page-header.png"
              alt=""
              aria-hidden
              width={610}
              height={751}
              sizes="64px"
              className="h-14 w-auto select-none object-contain sm:h-16"
            />
          </div>
          <div className="min-w-0 pt-1">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
              {LJD_NUMEROLOGY_READING_PAGE_TITLE}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-stone-600 sm:text-base sm:leading-7">
              {LJD_NUMEROLOGY_READING_LEAD}
            </p>
          </div>
        </div>
      </header>

      <section aria-labelledby="ljd-numerology-reading-intro" className="space-y-5">
        <h2 id="ljd-numerology-reading-intro" className={SECTION_HEADING_CLASS}>
          数字とLJD
        </h2>
        <div className="space-y-4 text-sm leading-relaxed text-stone-700 sm:text-base sm:leading-7">
          {LJD_NUMEROLOGY_READING_INTRO_PARAGRAPHS.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <p className="border-l-[3px] border-stone-400 pl-3.5 text-sm italic leading-relaxed text-stone-500 sm:pl-4">
          {LJD_NUMEROLOGY_READING_INTRO_QUOTE}
        </p>
      </section>

      <section aria-labelledby="ljd-numerology-reading-themes" className="space-y-5">
        <h2 id="ljd-numerology-reading-themes" className={SECTION_HEADING_CLASS}>
          {LJD_NUMEROLOGY_READING_THEME_SECTION_TITLE}
        </h2>
        <p className="text-sm leading-relaxed text-stone-600 sm:text-base sm:leading-7">
          日記の「今日・今月・今年のすうじ」は、1〜9 それぞれにテーマがあります。
        </p>
        <NumerologyNumbersDictionaryView embedded />
      </section>

      <section aria-labelledby="ljd-numerology-reading-index" className="space-y-5">
        <h2 id="ljd-numerology-reading-index" className={SECTION_HEADING_CLASS}>
          {LJD_NUMEROLOGY_READING_NUMBER_INDEX_TITLE}
        </h2>
        <div className="space-y-6">
          {NUMBER_GUIDE_CATEGORIES.map((category) => (
            <div key={category.id}>
              <h3 className={SUBSECTION_HEADING_CLASS}>{category.title}</h3>
              <ul className="mt-3 space-y-2">
                {NUMBER_GUIDE_ENTRIES.filter((entry) => entry.categoryId === category.id).map(
                  (entry) => (
                    <li key={entry.id}>
                      <a
                        href={`#${numberGuideAnchorId(entry.id)}`}
                        className="text-sm leading-relaxed text-stone-700 underline-offset-2 hover:text-emerald-900 hover:underline sm:text-[0.9375rem]"
                      >
                        {entry.listLabel}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="ljd-numerology-reading-details" className="space-y-5">
        <h2 id="ljd-numerology-reading-details" className={SECTION_HEADING_CLASS}>
          {LJD_NUMEROLOGY_READING_NUMBER_DETAIL_TITLE}
        </h2>
        <p className="text-sm leading-relaxed text-stone-600 sm:text-base sm:leading-7">
          項目を開くと、「とは」の説明と、LJDでの使われ方を読めます。
        </p>
        <NumberGuideAccordionSection categories={NUMBER_GUIDE_CATEGORIES} />
      </section>

      <p className="border-t border-stone-200/90 pt-8 text-xs leading-relaxed text-stone-500">
        {NUMEROLOGY_NUMBERS_PAGE_FOOTNOTE}
      </p>
    </div>
  );
}
