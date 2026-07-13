"use client";

import Image from "next/image";
import { useLayoutEffect, useState } from "react";

import { CompanionSaveForestDeliveryIndicator } from "@/components/journal/companion-writing/CompanionSaveForestDeliveryIndicator";
import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";
import { guardianColorStyleForName } from "@/lib/journal/guardianColorDisplay";
import {
  COMPANION_SAVE_FOREST_FRAMES,
  COMPANION_SAVE_FOREST_FRAME_STEP_MS,
  preloadCompanionSaveForestAssets,
} from "@/lib/journal/companionWriting/companionSaveForestAssets";
import {
  COMPANION_WRITING_FOREST_DELIVERY_ARRIVED_TEXT,
  COMPANION_WRITING_FOREST_DELIVERY_CARD_TEXT,
  COMPANION_WRITING_SAVE_LOADING_LABEL,
} from "@/lib/journal/companionWriting/types";
import {
  SAVE_TRANSITION_FOREST_BG_DESKTOP_SRC,
  SAVE_TRANSITION_FOREST_BG_MOBILE_SRC,
} from "@/lib/journal/saveTransitionAssets";

const CARD_STYLE = guardianColorStyleForName(null);
const ARRIVED_FRAME_INDEX = COMPANION_SAVE_FOREST_FRAMES.length - 1;

export function CompanionWritingForestDeliveryOverlay() {
  const [assetsReady, setAssetsReady] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);

  useLayoutEffect(() => {
    let cancelled = false;
    void preloadCompanionSaveForestAssets().then(() => {
      if (!cancelled) setAssetsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useLayoutEffect(() => {
    if (!assetsReady) return;
    let cancelled = false;
    const timers: number[] = [];

    const revealAll = () => {
      if (!cancelled) setVisibleCount(COMPANION_SAVE_FOREST_FRAMES.length);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      revealAll();
      return () => {
        cancelled = true;
      };
    }

    COMPANION_SAVE_FOREST_FRAMES.forEach((_, index) => {
      timers.push(
        window.setTimeout(() => {
          if (!cancelled) setVisibleCount(index + 1);
        }, index * COMPANION_SAVE_FOREST_FRAME_STEP_MS),
      );
    });

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [assetsReady]);

  const arrived = visibleCount > ARRIVED_FRAME_INDEX;
  const deliveryText = arrived
    ? COMPANION_WRITING_FOREST_DELIVERY_ARRIVED_TEXT
    : COMPANION_WRITING_FOREST_DELIVERY_CARD_TEXT;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#f3ebe2] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="今日の1ページが鑑定のへやへ届く演出"
      aria-live="polite"
      aria-busy="true"
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
        <div className="absolute inset-0 bg-[#faf8f5]/10" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div
          className="overflow-hidden rounded-2xl shadow-[0_14px_44px_rgba(80,62,44,0.14)]"
          style={{
            borderWidth: 1.5,
            borderStyle: "solid",
            borderColor: CARD_STYLE.borderColor,
            backgroundColor: CARD_STYLE.backgroundColor,
          }}
        >
          <div className="h-1.5" style={{ backgroundColor: CARD_STYLE.topAccent }} />
          <div className="px-6 pb-8 pt-8 text-center">
            {assetsReady ? (
              <>
                <CompanionSaveForestDeliveryIndicator visibleCount={visibleCount} />
                <p className="mt-5 whitespace-pre-wrap text-[15px] font-medium leading-7 tracking-wide text-stone-800">
                  {deliveryText}
                </p>
              </>
            ) : (
              <OwlLoadingInline
                label={COMPANION_WRITING_SAVE_LOADING_LABEL}
                size="md"
                className="text-sm text-stone-700"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
