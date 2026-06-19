"use client";

import Image from "next/image";
import { useLayoutEffect, useState } from "react";

import { SaveTransitionAcornIndicator } from "@/components/journal/SaveTransitionAcornIndicator";
import { guardianColorStyleForName } from "@/lib/journal/guardianColorDisplay";
import type { SaveAfterAnimalPick } from "@/lib/journal/journalSaveAfterAnimalMessages";
import {
  SAVE_TRANSITION_OPENING_TEXT,
  SAVE_TRANSITION_PHASE1_MS,
} from "@/lib/journal/journalSaveAfterAnimalMessages";
import {
  SAVE_TRANSITION_FOREST_BG_DESKTOP_SRC,
  SAVE_TRANSITION_FOREST_BG_MOBILE_SRC,
  preloadSaveTransitionAnimalAsset,
  preloadSaveTransitionOpeningAssets,
} from "@/lib/journal/saveTransitionAssets";

type Props = {
  animal: SaveAfterAnimalPick;
  guardianColorName: string | null;
  /** 保存API応答後 true（お守りカラー確定 or 未鑑定と判明） */
  guardianColorResolved: boolean;
};

type Phase = "opening" | "animal";

const OPENING_CARD_STYLE = guardianColorStyleForName(null);

/**
 * 新規日記保存直後：2段構成の刹那演出。
 * 1段目・2段目それぞれ要素をまとめて表示する（ぱっ、ぱっ）。
 * プレビューには残さない。
 */
export function JournalSaveStoryTransitionOverlay({
  animal,
  guardianColorName,
  guardianColorResolved,
}: Props) {
  const [phase, setPhase] = useState<Phase>("opening");
  const [openingElapsed, setOpeningElapsed] = useState(false);
  const [openingBeatReady, setOpeningBeatReady] = useState(false);
  const [animalBeatReady, setAnimalBeatReady] = useState(false);
  const animalColorStyle = guardianColorStyleForName(guardianColorName);

  useLayoutEffect(() => {
    let cancelled = false;

    void preloadSaveTransitionOpeningAssets().then(() => {
      if (!cancelled) setOpeningBeatReady(true);
    });
    void preloadSaveTransitionAnimalAsset(animal.imagePath).then(() => {
      if (!cancelled) setAnimalBeatReady(true);
    });

    const timer = window.setTimeout(() => {
      if (!cancelled) setOpeningElapsed(true);
    }, SAVE_TRANSITION_PHASE1_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [animal.imagePath]);

  useLayoutEffect(() => {
    if (openingElapsed && guardianColorResolved && animalBeatReady) {
      setPhase("animal");
    }
  }, [openingElapsed, guardianColorResolved, animalBeatReady]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#f3ebe2] px-4"
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      {openingBeatReady ? (
        <>
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
            {phase === "opening" ? (
              <div
                className="overflow-hidden rounded-2xl shadow-[0_14px_44px_rgba(80,62,44,0.14)]"
                style={{
                  borderWidth: 1.5,
                  borderStyle: "solid",
                  borderColor: OPENING_CARD_STYLE.borderColor,
                  backgroundColor: OPENING_CARD_STYLE.backgroundColor,
                }}
              >
                <div
                  className="h-1.5"
                  style={{ backgroundColor: OPENING_CARD_STYLE.topAccent }}
                />
                <div className="px-6 pb-8 pt-8 text-center">
                  <SaveTransitionAcornIndicator />
                  <p className="mt-5 whitespace-pre-wrap text-[15px] font-medium leading-7 tracking-wide text-stone-800">
                    {SAVE_TRANSITION_OPENING_TEXT}
                  </p>
                </div>
              </div>
            ) : null}

            {animalBeatReady ? (
              <div
                className={phase === "animal" ? undefined : "hidden"}
                aria-hidden={phase !== "animal"}
              >
                <div
                  className="overflow-hidden rounded-2xl shadow-[0_14px_44px_rgba(80,62,44,0.14)]"
                  style={{
                    borderWidth: 1.5,
                    borderStyle: "solid",
                    borderColor: animalColorStyle.borderColor,
                    backgroundColor: animalColorStyle.backgroundColor,
                  }}
                >
                  <div className="h-1.5" style={{ backgroundColor: animalColorStyle.topAccent }} />
                  <div className="flex flex-col px-6 pb-7 pt-7">
                    <div className="flex justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element -- 先読み済み img で2段目を一括表示 */}
                      <img
                        src={animal.imagePath}
                        alt=""
                        width={88}
                        height={88}
                        decoding="sync"
                        className="h-[88px] w-[88px] object-contain object-bottom"
                      />
                    </div>
                    <p className="mt-4 w-full text-start text-[15px] leading-7 text-stone-800 whitespace-pre-wrap">
                      {animal.message}
                    </p>
                    <p className="mt-3 ml-auto text-sm font-semibold text-stone-700">
                      {animal.name}より
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
