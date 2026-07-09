import Image from "next/image";
import Link from "next/link";

import {
  FOREST_GUIDE_STATION_FIRST_VISIT_CARD_BODY,
  FOREST_GUIDE_STATION_FIRST_VISIT_CARD_BUTTON,
  FOREST_GUIDE_STATION_FIRST_VISIT_SECTION_TITLE,
} from "@/lib/help/forestGuideStation";
import {
  FIRST_VISIT_PATH_GUIDE_ASSETS,
  FIRST_VISIT_PATH_GUIDE_IMAGE_SIZES,
  FIRST_VISIT_PATH_GUIDE_YOUNG_LEAF_SIZE,
} from "@/lib/onboarding/firstVisitWizard/pathGuideAssets";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";

const buttonClass =
  "inline-flex min-h-[44px] items-center justify-center rounded-lg border border-emerald-200/80 bg-white px-4 py-2.5 text-sm font-medium text-emerald-950 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/90";

/** 森の案内所：はじめての道しるべカード */
export function LjdFirstVisitFlowCard() {
  return (
    <section aria-labelledby="forest-guide-first-visit-heading">
      <article className="overflow-hidden rounded-xl border border-stone-200 bg-[#fffdf9] shadow-sm">
        <div className="flex items-stretch gap-3 p-4 sm:gap-4 sm:p-5">
          <div className="min-w-0 flex-1">
            <h2
              id="forest-guide-first-visit-heading"
              className="text-base font-semibold text-stone-900 sm:text-lg"
            >
              {FOREST_GUIDE_STATION_FIRST_VISIT_SECTION_TITLE}
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-stone-600">
              {FOREST_GUIDE_STATION_FIRST_VISIT_CARD_BODY}
            </p>
            <p className="mt-4">
              <Link href={FIRST_VISIT_ROUTES.pathGuide} className={buttonClass}>
                {FOREST_GUIDE_STATION_FIRST_VISIT_CARD_BUTTON}
              </Link>
            </p>
          </div>

          <div className="relative w-[5.5rem] shrink-0 self-center sm:w-[7rem]">
            <Image
              src={FIRST_VISIT_PATH_GUIDE_ASSETS.youngLeaf}
              alt=""
              width={FIRST_VISIT_PATH_GUIDE_YOUNG_LEAF_SIZE.widthPx}
              height={FIRST_VISIT_PATH_GUIDE_YOUNG_LEAF_SIZE.heightPx}
              sizes={FIRST_VISIT_PATH_GUIDE_IMAGE_SIZES}
              className="h-auto w-full object-contain"
            />
          </div>
        </div>
      </article>
    </section>
  );
}
