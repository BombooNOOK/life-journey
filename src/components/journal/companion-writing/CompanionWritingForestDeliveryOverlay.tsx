"use client";

import Image from "next/image";
import { useLayoutEffect } from "react";

import { CompanionSaveForestDeliveryIndicator } from "@/components/journal/companion-writing/CompanionSaveForestDeliveryIndicator";
import { preloadCompanionSaveForestAssets } from "@/lib/journal/companionWriting/companionSaveForestAssets";
import {
  SAVE_TRANSITION_FOREST_BG_DESKTOP_SRC,
  SAVE_TRANSITION_FOREST_BG_MOBILE_SRC,
} from "@/lib/journal/saveTransitionAssets";

export function CompanionWritingForestDeliveryOverlay() {
  useLayoutEffect(() => {
    void preloadCompanionSaveForestAssets();
  }, []);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#e8efe4] px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label="今日の1ページが森へ届く演出"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <Image
          src={SAVE_TRANSITION_FOREST_BG_MOBILE_SRC}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center md:hidden"
          priority
        />
        <Image
          src={SAVE_TRANSITION_FOREST_BG_DESKTOP_SRC}
          alt=""
          fill
          sizes="100vw"
          className="hidden object-cover object-center md:block"
          priority
        />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <CompanionSaveForestDeliveryIndicator />
      </div>
    </div>
  );
}
