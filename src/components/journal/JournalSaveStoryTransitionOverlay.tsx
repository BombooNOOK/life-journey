"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { SaveTransitionAcornIndicator } from "@/components/journal/SaveTransitionAcornIndicator";
import { guardianColorStyleForName } from "@/lib/journal/guardianColorDisplay";
import type { SaveAfterAnimalPick } from "@/lib/journal/journalSaveAfterAnimalMessages";
import {
  SAVE_TRANSITION_OPENING_TEXT,
  SAVE_TRANSITION_PHASE1_MS,
} from "@/lib/journal/journalSaveAfterAnimalMessages";

type Props = {
  animal: SaveAfterAnimalPick;
  guardianColorName: string | null;
  /** 保存API応答後 true（お守りカラー確定 or 未鑑定と判明） */
  guardianColorResolved: boolean;
};

type Phase = "opening" | "animal";

/**
 * 新規日記保存直後：2段構成の刹那演出。
 * プレビューには残さない。
 */
export function JournalSaveStoryTransitionOverlay({
  animal,
  guardianColorName,
  guardianColorResolved,
}: Props) {
  const [phase, setPhase] = useState<Phase>("opening");
  const [openingElapsed, setOpeningElapsed] = useState(false);
  const colorStyle = guardianColorStyleForName(guardianColorName);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setOpeningElapsed(true);
    }, SAVE_TRANSITION_PHASE1_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (openingElapsed && guardianColorResolved) {
      setPhase("animal");
    }
  }, [openingElapsed, guardianColorResolved]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-[#e8dfd2] via-[#f3ebe2] to-[#ddd4c8] px-4"
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      <div className="w-full max-w-sm">
        <div
          className="overflow-hidden rounded-2xl shadow-[0_14px_44px_rgba(80,62,44,0.14)] transition-[border-color,background-color] duration-500"
          style={{
            borderWidth: 1.5,
            borderStyle: "solid",
            borderColor: colorStyle.borderColor,
            backgroundColor: colorStyle.backgroundColor,
          }}
        >
          <div
            className="h-1.5 transition-[background-color] duration-500"
            style={{ backgroundColor: colorStyle.topAccent }}
          />

          {phase === "opening" ? (
            <div className="px-6 pb-8 pt-8 text-center">
              <SaveTransitionAcornIndicator />
              <p className="mt-5 whitespace-pre-wrap text-[15px] font-medium leading-7 tracking-wide text-stone-800">
                {SAVE_TRANSITION_OPENING_TEXT}
              </p>
            </div>
          ) : (
            <div className="px-6 pb-7 pt-7 text-center">
              <div className="relative mx-auto h-[88px] w-[88px]">
                <Image
                  src={animal.imagePath}
                  alt=""
                  fill
                  className="object-contain object-bottom"
                  sizes="88px"
                  unoptimized
                />
              </div>
              <p className="mt-4 text-sm font-semibold text-stone-700">{animal.name}より</p>
              <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-stone-800">
                {animal.message}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
