"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import {
  BAMBOO_FOREST_GUIDE_MAP_INTRINSIC,
  bambooForestGuideMapSrc,
} from "@/lib/help/bambooForestGuideMap";
import type { FirstVisitWelcomeViewport } from "@/lib/onboarding/firstVisitWizard/welcomeAssets";

type Props = {
  className?: string;
  /** 案内図の説明（スクリーンリーダー向け） */
  alt?: string;
};

function useGuideMapViewport(): FirstVisitWelcomeViewport | null {
  const [viewport, setViewport] = useState<FirstVisitWelcomeViewport | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setViewport(mq.matches ? "desktop" : "mobile");
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return viewport;
}

/** BambooNOOKの森の案内図 */
export function BambooForestGuideMap({
  className = "",
  alt = "BambooNOOKの森の案内図",
}: Props) {
  const viewport = useGuideMapViewport();

  if (!viewport) {
    return (
      <div
        className={[
          "aspect-[9/16] w-full max-w-md animate-pulse rounded-xl bg-stone-200/80 lg:aspect-video lg:max-w-2xl",
          className,
        ].join(" ")}
        aria-hidden
      />
    );
  }

  const intrinsic = BAMBOO_FOREST_GUIDE_MAP_INTRINSIC[viewport];
  const isDesktop = viewport === "desktop";

  return (
    <figure className={className}>
      <div
        className={[
          "relative mx-auto w-full overflow-hidden rounded-xl border border-stone-200/90 bg-[#ebe4d4] shadow-sm",
          isDesktop ? "max-w-2xl" : "max-w-md",
        ].join(" ")}
      >
        <Image
          src={bambooForestGuideMapSrc(viewport)}
          alt={alt}
          width={intrinsic.widthPx}
          height={intrinsic.heightPx}
          sizes={isDesktop ? "(min-width: 1024px) 42rem, 100vw" : "(max-width: 1023px) 100vw, 28rem"}
          className={[
            "h-auto w-full",
            isDesktop ? "object-contain" : "object-cover object-[50%_54%]",
          ].join(" ")}
          quality={100}
          unoptimized
        />
      </div>
      <figcaption className="sr-only">{alt}</figcaption>
    </figure>
  );
}
