"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { CompanionWritingGuideCardShell } from "@/components/journal/companion-writing/CompanionWritingGuideCardShell";
import { CompanionWritingGuideStage } from "@/components/journal/companion-writing/CompanionWritingGuideStage";
import {
  companionWritingGuideBodyClass,
  companionWritingGuidePrimaryButtonClass,
  companionWritingGuideTitleClass,
} from "@/components/journal/companion-writing/companionWritingGuideStyles";
import { COMPANION_WRITING_APPRAISER_FACE } from "@/lib/journal/companionWriting/appraiserFaces";
import {
  clearCompanionWritingPreviewGuide,
  writeCompanionWritingFarewell,
} from "@/lib/journal/companionWriting/session";
import {
  COMPANION_WRITING_CALENDAR_GUIDE_NEXT_LABEL,
  COMPANION_WRITING_PREVIEW_GUIDE_CLOSING,
  COMPANION_WRITING_PREVIEW_GUIDE_FINISH_LABEL,
  COMPANION_WRITING_PREVIEW_GUIDE_READ_BODY,
  COMPANION_WRITING_PREVIEW_GUIDE_READ_TITLE,
  COMPANION_WRITING_PREVIEW_GUIDE_WRITE_BODY,
  COMPANION_WRITING_PREVIEW_GUIDE_WRITE_TITLE,
} from "@/lib/journal/companionWriting/types";
import { getDecorationAsset } from "@/lib/decorations/catalog";
import type { CompanionType } from "@/lib/journal/meta";

const COMPANION_FACE_TUNING: Record<CompanionType, { objectPosition: string; scale: number }> = {
  owl: { objectPosition: "50% 48%", scale: 1.08 },
  hedgehog: { objectPosition: "50% 42%", scale: 1.02 },
  sloth: { objectPosition: "50% 44%", scale: 1.14 },
  squirrel: { objectPosition: "50% 36%", scale: 1.1 },
  frog: { objectPosition: "50% 40%", scale: 1.12 },
};

type Props = {
  phase: "read" | "write";
  companionType: CompanionType;
  onNext: () => void;
};

export function CompanionWritingPreviewFarewellGuide({ phase, companionType, onNext }: Props) {
  const router = useRouter();
  const faceAsset = getDecorationAsset(COMPANION_WRITING_APPRAISER_FACE[companionType]);
  const faceTuning = COMPANION_FACE_TUNING[companionType];
  const isReadPhase = phase === "read";

  const finish = () => {
    clearCompanionWritingPreviewGuide();
    writeCompanionWritingFarewell();
    router.push("/");
  };

  return (
    <CompanionWritingGuideStage
      ariaLabel={
        isReadPhase
          ? COMPANION_WRITING_PREVIEW_GUIDE_READ_TITLE
          : COMPANION_WRITING_PREVIEW_GUIDE_WRITE_TITLE
      }
    >
      <CompanionWritingGuideCardShell>
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-emerald-100 bg-white shadow-sm">
            <Image
              src={faceAsset.src}
              alt=""
              width={faceAsset.width}
              height={faceAsset.height}
              className="absolute inset-0 h-full w-full object-cover"
              style={{
                objectPosition: faceTuning.objectPosition,
                transform: `scale(${faceTuning.scale})`,
              }}
              sizes="64px"
            />
          </div>
          <h2 className={`${companionWritingGuideTitleClass} text-center`}>
            {isReadPhase
              ? COMPANION_WRITING_PREVIEW_GUIDE_READ_TITLE
              : COMPANION_WRITING_PREVIEW_GUIDE_WRITE_TITLE}
          </h2>
          <p className={`${companionWritingGuideBodyClass} mt-0 text-center`}>
            {isReadPhase
              ? COMPANION_WRITING_PREVIEW_GUIDE_READ_BODY
              : COMPANION_WRITING_PREVIEW_GUIDE_WRITE_BODY}
          </p>
          {!isReadPhase ? (
            <p className="text-center text-sm font-medium leading-relaxed text-emerald-900">
              {COMPANION_WRITING_PREVIEW_GUIDE_CLOSING}
            </p>
          ) : null}
        </div>

        <div className="mt-5">
          {isReadPhase ? (
            <button type="button" onClick={onNext} className={companionWritingGuidePrimaryButtonClass}>
              {COMPANION_WRITING_CALENDAR_GUIDE_NEXT_LABEL}
            </button>
          ) : (
            <button type="button" onClick={finish} className={companionWritingGuidePrimaryButtonClass}>
              {COMPANION_WRITING_PREVIEW_GUIDE_FINISH_LABEL}
            </button>
          )}
        </div>
      </CompanionWritingGuideCardShell>
    </CompanionWritingGuideStage>
  );
}
