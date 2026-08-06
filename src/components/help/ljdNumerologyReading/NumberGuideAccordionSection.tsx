"use client";

import { useCallback, useEffect, useState } from "react";

import { ManuscriptGuideBody } from "@/components/help/ManuscriptGuideBody";
import {
  numberGuideAnchorId,
  numberGuideEntriesForCategory,
  resolveNumberGuideContent,
  type NumberGuideCategory,
  type NumberGuideEntry,
} from "@/lib/help/ljdNumerologyReading/numberTypeCatalog";

function NumberGuideAccordionItem({ entry }: { entry: NumberGuideEntry }) {
  const [isOpen, setIsOpen] = useState(false);
  const anchorId = numberGuideAnchorId(entry.id);
  const content = resolveNumberGuideContent(entry);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    const syncFromHash = () => {
      if (window.location.hash === `#${anchorId}`) {
        setIsOpen(true);
      }
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [anchorId]);

  return (
    <article id={anchorId} className="scroll-mt-24 border-b border-stone-200/90 last:border-b-0">
      <button
        type="button"
        id={`${anchorId}-heading`}
        aria-expanded={isOpen}
        aria-controls={`${anchorId}-panel`}
        onClick={toggle}
        className="flex w-full items-start gap-3 py-4 text-left transition hover:bg-stone-50/60"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold text-stone-900">{entry.listLabel}</span>
          <span className="mt-0.5 block text-sm text-stone-500">{entry.subtitle}</span>
        </span>
        <span className="mt-1 shrink-0 text-stone-400" aria-hidden>
          {isOpen ? "−" : "+"}
        </span>
      </button>

      {isOpen ? (
        <div
          id={`${anchorId}-panel`}
          role="region"
          aria-labelledby={`${anchorId}-heading`}
          className="space-y-5 border-t border-stone-100 pb-5 pt-4"
        >
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-800/90">
              このナンバーとは
            </h4>
            <div className="mt-2">
              <ManuscriptGuideBody body={content.body} />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-800/90">
              LJDでの使われ方
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-stone-700">{entry.ljdUsage}</p>
          </div>

          {entry.diaryHint ? (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-800/90">
                あしあとを見返すとき
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-stone-700">{entry.diaryHint}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

type Props = {
  categories: NumberGuideCategory[];
};

export function NumberGuideAccordionSection({ categories }: Props) {
  return (
    <div className="space-y-8">
      {categories.map((category) => {
        const entries = numberGuideEntriesForCategory(category.id);
        return (
          <section key={category.id} aria-labelledby={`number-guide-category-${category.id}`}>
            <h3
              id={`number-guide-category-${category.id}`}
              className="border-b border-stone-200/90 pb-2 text-base font-semibold text-stone-800 sm:text-[1.05rem]"
            >
              {category.title}
            </h3>
            <div className="mt-1">
              {entries.map((entry) => (
                <NumberGuideAccordionItem key={entry.id} entry={entry} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
