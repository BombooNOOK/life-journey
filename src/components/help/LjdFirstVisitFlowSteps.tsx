"use client";

import Link from "next/link";

import {
  FOREST_GUIDE_FIRST_VISIT_STEPS,
  FOREST_GUIDE_STATION_FIRST_VISIT_SECTION_TITLE,
} from "@/lib/help/forestGuideStation";

/** 森の案内所：はじめての道しるべ（折りたたみステップ一覧） */
export function LjdFirstVisitFlowSteps() {
  return (
    <section aria-labelledby="forest-guide-first-visit-heading">
      <details className="group rounded-xl border border-stone-200 bg-white shadow-sm">
        <summary
          id="forest-guide-first-visit-heading"
          className="cursor-pointer list-none px-4 py-3.5 text-base font-semibold text-stone-900 marker:content-none sm:px-5 sm:py-4 sm:text-lg [&::-webkit-details-marker]:hidden"
        >
          <span className="flex items-center justify-between gap-3">
            <span>{FOREST_GUIDE_STATION_FIRST_VISIT_SECTION_TITLE}</span>
            <span
              aria-hidden
              className="shrink-0 text-xs font-normal text-stone-400 transition group-open:rotate-180"
            >
              ▼
            </span>
          </span>
        </summary>

        <div className="space-y-3 border-t border-stone-200/80 px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
          <p className="text-sm leading-6 text-stone-600">
            はじめて使う方が、全体の流れをあとから確認できる案内です。
          </p>

          <ol className="space-y-2">
            {FOREST_GUIDE_FIRST_VISIT_STEPS.map((item) => (
              <li key={item.step}>
                <article className="rounded-xl border border-stone-200 bg-[#fffdf9] px-4 py-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/90">
                    STEP {item.step}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-stone-900">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-stone-600">{item.body}</p>
                  {item.link ? (
                    <p className="mt-2.5">
                      <Link
                        href={item.link.href}
                        className="text-sm font-medium text-emerald-900 underline-offset-2 hover:underline"
                      >
                        {item.link.label} →
                      </Link>
                    </p>
                  ) : null}
                </article>
              </li>
            ))}
          </ol>
        </div>
      </details>
    </section>
  );
}
