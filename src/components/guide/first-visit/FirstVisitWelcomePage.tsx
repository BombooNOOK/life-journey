"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";

import { ReadingFontSizeControl } from "@/components/reading/ReadingFontSizeControl";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import {
  FIRST_VISIT_WELCOME_COPY,
  firstVisitWelcomeBgSrc,
  firstVisitWelcomeCopyFor,
  isFirstVisitWelcomeMobileCopy,
  type FirstVisitWelcomeViewport,
} from "@/lib/onboarding/firstVisitWizard/welcomeAssets";
import {
  firstVisitWelcomeBlankLineGapPx,
  firstVisitWelcomeContainLayout,
  firstVisitWelcomeMessageTextPlacement,
  firstVisitWelcomeMessageTextStyle,
  firstVisitWelcomeMessageTypography,
} from "@/lib/onboarding/firstVisitWizard/welcomeLayout";
import type { ObjectCoverLayout } from "@/lib/home/homeForestSignLayout";

function useWelcomeViewport(): FirstVisitWelcomeViewport | null {
  const [viewport, setViewport] = useState<FirstVisitWelcomeViewport | null>(null);

  useLayoutEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setViewport(media.matches ? "desktop" : "mobile");
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return viewport;
}

function initialStageLayout(viewport: FirstVisitWelcomeViewport): ObjectCoverLayout | null {
  if (typeof window === "undefined") return null;
  const w = window.visualViewport?.width ?? window.innerWidth;
  const h = window.visualViewport?.height ?? window.innerHeight;
  return firstVisitWelcomeContainLayout(w, h, viewport);
}

type MessageTextProps = {
  viewport: FirstVisitWelcomeViewport;
  stageLayout: ObjectCoverLayout | null;
};

function FirstVisitWelcomeMobileBody({
  body,
  bodyPx,
  lineHeight,
  narrowBlankPx,
}: {
  body: string;
  bodyPx: number;
  lineHeight: number;
  narrowBlankPx: number;
}) {
  return (
    <div style={{ fontSize: `${bodyPx}px`, lineHeight }}>
      {body.split("\n").map((line, index) =>
        line.length === 0 ? (
          <div key={`blank-${index}`} style={{ height: `${narrowBlankPx}px` }} aria-hidden />
        ) : (
          <p key={`line-${index}`} className="m-0">
            {line}
          </p>
        ),
      )}
    </div>
  );
}

/** 地図看板の内側に重ねるウェルカム文（看板枠・施設名は Canva 背景側） */
function FirstVisitWelcomeMessageText({ viewport, stageLayout }: MessageTextProps) {
  const placement = firstVisitWelcomeMessageTextPlacement(viewport);
  const copy = firstVisitWelcomeCopyFor(viewport);
  const style = firstVisitWelcomeMessageTextStyle(placement, stageLayout);
  const typography = firstVisitWelcomeMessageTypography(placement, stageLayout);
  const scale = stageLayout?.scale ?? 1;
  const paddingTop = (placement.paddingTopPx ?? 6) * scale;
  const paragraphGap = (placement.paragraphGapPx ?? 4) * scale;
  const blankLineGap = firstVisitWelcomeBlankLineGapPx(placement) * scale;
  const isMobileCopy = isFirstVisitWelcomeMobileCopy(copy);
  const headingBodyGap = isMobileCopy ? blankLineGap : (placement.headingBodyGapPx ?? 4) * scale;

  return (
    <div
      className={[
        "pointer-events-none absolute z-20 flex flex-col justify-start text-center",
        isMobileCopy ? "px-0" : "px-1.5 sm:px-2",
      ].join(" ")}
      style={{ ...style, paddingTop: `${paddingTop}px` }}
      aria-hidden
    >
      <p
        className="shrink-0 font-bold leading-tight text-[#5c4638]"
        style={{ fontSize: `${typography.headingPx}px`, lineHeight: 1.26 }}
      >
        {copy.heading}
      </p>
      {isMobileCopy ? (
        <div className="text-[#6b5344]" style={{ marginTop: `${headingBodyGap}px` }}>
          <FirstVisitWelcomeMobileBody
            body={copy.body}
            bodyPx={typography.bodyPx}
            lineHeight={typography.lineHeight}
            narrowBlankPx={blankLineGap}
          />
        </div>
      ) : (
        <div
          className="text-[#6b5344]"
          style={{
            marginTop: `${headingBodyGap}px`,
            fontSize: `${typography.bodyPx}px`,
            lineHeight: typography.lineHeight,
          }}
        >
          {copy.paragraphs.map((paragraph, index) => (
            <p
              key={paragraph}
              className="whitespace-pre-line"
              style={index > 0 ? { marginTop: `${paragraphGap}px` } : undefined}
            >
              {paragraph}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/** 第1幕：森へようこそ（単独全画面・カードUIではない） */
export function FirstVisitWelcomePage() {
  const viewport = useWelcomeViewport();
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageLayout, setStageLayout] = useState<ObjectCoverLayout | null>(() =>
    viewport ? initialStageLayout(viewport) : null,
  );

  useLayoutEffect(() => {
    if (!viewport) return;
    const stage = stageRef.current;
    if (!stage) return;

    const update = () => {
      const rect = stage.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      setStageLayout(firstVisitWelcomeContainLayout(rect.width, rect.height, viewport));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [viewport]);

  const bgSrc = viewport ? firstVisitWelcomeBgSrc(viewport) : null;

  return (
    <section
      className="home-read-scope relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#ebe4d4]"
      aria-labelledby="first-visit-welcome-heading"
    >
      <h1 id="first-visit-welcome-heading" className="sr-only">
        はじめての方へ — {firstVisitWelcomeCopyFor(viewport ?? "mobile").heading}
      </h1>

      <div ref={stageRef} className="relative min-h-0 flex-1">
        {viewport && bgSrc ? (
          <>
            <Image
              src={bgSrc}
              alt=""
              fill
              sizes={viewport === "mobile" ? "100vw" : "100vw"}
              className="object-contain object-center"
              quality={100}
              priority
              unoptimized
            />
            <FirstVisitWelcomeMessageText viewport={viewport} stageLayout={stageLayout} />
          </>
        ) : null}
      </div>

      <div className="relative z-30 shrink-0 border-t border-stone-300/40 bg-[#fffdf9]/90 px-4 py-4 backdrop-blur-[1px] sm:px-6">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
          <Link
            href={FIRST_VISIT_ROUTES.about}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-emerald-800 px-5 py-3 text-base font-medium text-white shadow-sm transition hover:bg-emerald-900"
          >
            {FIRST_VISIT_WELCOME_COPY.nextLabel}
          </Link>
          <ReadingFontSizeControl variant="hero" comfortable />
        </div>
      </div>
    </section>
  );
}
