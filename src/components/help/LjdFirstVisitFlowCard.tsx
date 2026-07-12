"use client";

import Image from "next/image";
import Link from "next/link";

import {
  FOREST_GUIDE_STATION_FIRST_VISIT_CARD_BODY,
  FOREST_GUIDE_STATION_FIRST_VISIT_CARD_BUTTON,
  FOREST_GUIDE_STATION_FIRST_VISIT_SECTION_TITLE,
} from "@/lib/help/forestGuideStation";
import { FIRST_VISIT_PATH_GUIDE_ASSETS } from "@/lib/onboarding/firstVisitWizard/pathGuideAssets";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";

const buttonClass =
  "inline-flex min-h-[44px] items-center justify-center rounded-lg border border-emerald-200/80 bg-white px-4 py-2.5 text-sm font-medium text-emerald-950 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/90";

/** 森の案内所：はじめての道しるべカード */
export function LjdFirstVisitFlowCard() {
  return (
    <section aria-labelledby="forest-guide-first-visit-heading">
      <article className="relative overflow-hidden rounded-xl border border-stone-200 bg-[#fffdf9] shadow-sm">
        <div
          className="pointer-events-none absolute right-2 top-2 h-9 w-9 sm:right-2.5 sm:top-2.5 sm:h-10 sm:w-10"
          aria-hidden
        >
          <Image
            src={FIRST_VISIT_PATH_GUIDE_ASSETS.youngLeaf}
            alt=""
            fill
            sizes="40px"
            className="object-contain object-right-top"
          />
        </div>

        <div className="p-4 pr-12 sm:p-5 sm:pr-14">
          <h2
            id="forest-guide-first-visit-heading"
            className="text-base font-semibold text-stone-900 sm:text-lg"
          >
            {FOREST_GUIDE_STATION_FIRST_VISIT_SECTION_TITLE}
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            {FOREST_GUIDE_STATION_FIRST_VISIT_CARD_BODY}
          </p>
          <p className="mt-4">
            <Link href={FIRST_VISIT_ROUTES.pathGuide} className={buttonClass}>
              {FOREST_GUIDE_STATION_FIRST_VISIT_CARD_BUTTON}
            </Link>
          </p>
        </div>
      </article>
    </section>
  );
}
