import Link from "next/link";

import {
  FOREST_GUIDE_FIRST_VISIT_STEPS,
  FOREST_GUIDE_STATION_FIRST_VISIT_SECTION_TITLE,
} from "@/lib/help/forestGuideStation";

/** 森の案内所：はじめての方の流れ（縦型ステップ一覧） */
export function LjdFirstVisitFlowSteps() {
  return (
    <section aria-labelledby="forest-guide-first-visit-heading" className="space-y-3">
      <div>
        <h2
          id="forest-guide-first-visit-heading"
          className="text-base font-semibold text-stone-900 sm:text-lg"
        >
          {FOREST_GUIDE_STATION_FIRST_VISIT_SECTION_TITLE}
        </h2>
        <p className="mt-1 text-sm leading-6 text-stone-600">
          はじめて使う方が、全体の流れをあとから確認できる案内です。
        </p>
      </div>

      <ol className="space-y-2">
        {FOREST_GUIDE_FIRST_VISIT_STEPS.map((item) => (
          <li key={item.step}>
            <article className="rounded-xl border border-stone-200 bg-white px-4 py-3.5 shadow-sm">
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
    </section>
  );
}
