"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";

import {
  companionWritingGuideTitleClass,
} from "@/components/journal/companion-writing/companionWritingGuideStyles";
import { FirstVisitWizardNav } from "@/components/guide/first-visit/FirstVisitWizardNav";
import { FirstVisitWizardPageHeader } from "@/components/guide/first-visit/FirstVisitWizardPageHeader";
import {
  FIRST_VISIT_ROADMAP_BUTTON,
  FIRST_VISIT_ROADMAP_CLOSING,
  FIRST_VISIT_ROADMAP_ILLUSTRATION_SRC,
  FIRST_VISIT_ROADMAP_INTRO,
  FIRST_VISIT_ROADMAP_STEPS,
  FIRST_VISIT_ROADMAP_TITLE,
} from "@/lib/onboarding/firstVisitWizard/roadmapCopy";
import {
  FIRST_VISIT_ROADMAP_DESIGN_SIZE,
  firstVisitRoadmapTextPlacement,
  firstVisitRoadmapTextStyle,
  type FirstVisitRoadmapViewport,
} from "@/lib/onboarding/firstVisitWizard/roadmapLayout";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";

function useRoadmapViewport(): FirstVisitRoadmapViewport {
  const [viewport, setViewport] = useState<FirstVisitRoadmapViewport>(() => {
    if (typeof window === "undefined") return "mobile";
    return window.matchMedia("(min-width: 1024px)").matches ? "desktop" : "mobile";
  });

  useLayoutEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setViewport(media.matches ? "desktop" : "mobile");
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return viewport;
}

function useRoadmapSignScale() {
  const ref = useRef<HTMLElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const sync = () => {
      const width = el.getBoundingClientRect().width;
      if (width > 0) {
        setScale(width / FIRST_VISIT_ROADMAP_DESIGN_SIZE.widthPx);
      }
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, scale };
}

/** 第3幕②：今日の道のり（看板内にテキストを重ねる） */
export function FirstVisitRoadmapPage() {
  const viewport = useRoadmapViewport();
  const { ref, scale } = useRoadmapSignScale();
  const placement = firstVisitRoadmapTextPlacement(viewport);
  const paddingTop = (placement.paddingTopPx ?? 0) * scale;
  const { widthPx, heightPx } = FIRST_VISIT_ROADMAP_DESIGN_SIZE;

  return (
    <div className="home-read-scope mx-auto w-full max-w-lg space-y-6 px-4 pb-8 pt-6 sm:px-6 sm:pt-8 lg:space-y-6">
      <FirstVisitWizardPageHeader stepLabel={FIRST_VISIT_ROADMAP_TITLE} className="hidden lg:block" />

      <section aria-labelledby="first-visit-roadmap-heading">
        <figure
          ref={ref}
          className="relative mx-auto w-full max-w-md sm:max-w-lg"
          style={{ aspectRatio: `${widthPx} / ${heightPx}` }}
        >
          <Image
            src={FIRST_VISIT_ROADMAP_ILLUSTRATION_SRC}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 32rem"
            className="object-contain"
            priority
          />

          <div
            id="first-visit-roadmap-heading"
            className="pointer-events-none absolute z-10 text-center text-[#5c4638]"
            style={{ ...firstVisitRoadmapTextStyle(placement, scale), paddingTop: `${paddingTop}px` }}
          >
            <p className={`m-0 ${companionWritingGuideTitleClass}`}>{FIRST_VISIT_ROADMAP_TITLE}</p>

            <p className="lj-read-desc m-0 mt-2 text-stone-700">{FIRST_VISIT_ROADMAP_INTRO}</p>

            <ol className="lj-read-desc m-0 mt-2 w-full list-none space-y-1.5 p-0 text-left text-stone-700 lg:inline-block lg:w-auto">
              {FIRST_VISIT_ROADMAP_STEPS.map((step, index) => (
                <li key={step} className="m-0 flex gap-1 leading-relaxed">
                  <span className="shrink-0 font-semibold text-emerald-950">{index + 1}.</span>
                  <span className="min-w-0 whitespace-pre-line">
                    {viewport === "desktop" ? step.replace(/\n/g, "") : step}
                  </span>
                </li>
              ))}
            </ol>

            <p className="lj-read-desc m-0 mt-3 whitespace-pre-line leading-relaxed text-stone-700">
              {FIRST_VISIT_ROADMAP_CLOSING}
            </p>
          </div>
        </figure>
      </section>

      <FirstVisitWizardNav
        backHref={FIRST_VISIT_ROUTES.owl}
        backLabel="フクロウ先生へ戻る"
        nextHref={FIRST_VISIT_ROUTES.guideStationSign}
        nextLabel={FIRST_VISIT_ROADMAP_BUTTON}
      />
    </div>
  );
}
