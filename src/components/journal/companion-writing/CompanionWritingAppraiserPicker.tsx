"use client";

import Image from "next/image";
import { useState } from "react";

import { getDecorationAsset } from "@/lib/decorations/catalog";
import { companionWritingChoiceFace } from "@/lib/journal/companionWriting/appraiserFaces";
import {
  COMPANION_WRITING_OMAKASE_ID,
  type CompanionWritingChoiceId,
} from "@/lib/journal/companionWriting/omakase";
import { COMPANION_WRITING_OMAKASE_LABEL } from "@/lib/journal/companionWriting/types";
import { companionOptions } from "@/lib/journal/meta";

type FaceTuning = {
  objectPosition: string;
  scale: number;
};

const FACE_TUNING: Record<string, FaceTuning> = {
  "character-owl-face": { objectPosition: "50% 48%", scale: 1.08 },
  "character-sloth-face": { objectPosition: "50% 44%", scale: 1.14 },
  "character-squirrel-face": { objectPosition: "50% 36%", scale: 1.1 },
  "character-hedgehog-face": { objectPosition: "50% 42%", scale: 1.02 },
  "character-kerosion-face": { objectPosition: "50% 40%", scale: 1.12 },
  "character-omakase-face": { objectPosition: "50% 50%", scale: 1 },
};

function AppraiserFaceIcon({ choiceId }: { choiceId: CompanionWritingChoiceId }) {
  const faceName = companionWritingChoiceFace(choiceId);
  const asset = getDecorationAsset(faceName);
  const tuning = FACE_TUNING[faceName] ?? { objectPosition: "50% 50%", scale: 1 };
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        aria-hidden
        className="mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border border-stone-200/70 bg-[#faf6ef] text-2xl text-stone-400 sm:h-20 sm:w-20"
      >
        ?
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className="relative mx-auto block h-[4.5rem] w-[4.5rem] overflow-hidden rounded-full border border-stone-200/55 bg-[#faf6ef] shadow-[0_2px_8px_rgba(107,90,74,0.08)] sm:h-20 sm:w-20"
    >
      <Image
        src={asset.src}
        alt=""
        width={asset.width}
        height={asset.height}
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          objectPosition: tuning.objectPosition,
          transform: `scale(${tuning.scale})`,
        }}
        onError={() => setFailed(true)}
      />
    </span>
  );
}

type Props = {
  selected: CompanionWritingChoiceId;
  onSelect: (choice: CompanionWritingChoiceId) => void;
};

export function CompanionWritingAppraiserPicker({ selected, onSelect }: Props) {
  const choices: Array<{ id: CompanionWritingChoiceId; label: string }> = [
    ...companionOptions.map((option) => ({ id: option.id, label: option.label })),
    { id: COMPANION_WRITING_OMAKASE_ID, label: COMPANION_WRITING_OMAKASE_LABEL },
  ];

  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-3.5"
      role="radiogroup"
      aria-label="今日の案内役"
    >
      {choices.map((choice) => {
        const isSelected = selected === choice.id;
        return (
          <button
            key={choice.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(choice.id)}
            className={[
              "flex min-h-[8.5rem] flex-col items-center justify-center gap-2.5 rounded-2xl border px-2 py-3.5 text-center transition sm:min-h-[9rem] sm:py-4",
              isSelected
                ? "border-[#a8b08f] bg-[#eef1e4]/95 ring-2 ring-[#c5d0a8]/80"
                : "border-[#e0d2bc]/90 bg-[#fffaf4]/95 hover:border-[#c5b089] hover:bg-[#f7efe3]/80",
            ].join(" ")}
          >
            <AppraiserFaceIcon choiceId={choice.id} />
            <span className="text-sm font-medium leading-snug text-stone-800">{choice.label}</span>
          </button>
        );
      })}
    </div>
  );
}
