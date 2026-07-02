"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { CompanionWritingGuideCardShell } from "@/components/journal/companion-writing/CompanionWritingGuideCardShell";
import { CompanionWritingGuideStage } from "@/components/journal/companion-writing/CompanionWritingGuideStage";
import {
  companionWritingGuidePrimaryButtonClass,
  companionWritingGuideSecondaryButtonClass,
} from "@/components/journal/companion-writing/companionWritingGuideStyles";
import { COMPANION_WRITING_APPRAISER_FACE } from "@/lib/journal/companionWriting/appraiserFaces";
import { getCompanionWritingCalendarWhisper } from "@/lib/journal/companionWriting/guideWhispers";
import {
  clearCompanionWritingCalendarComplete,
  prepareCompanionWritingGrowNavigation,
  writeCompanionWritingPreviewGuide,
  type CompanionWritingCalendarCompletePayload,
} from "@/lib/journal/companionWriting/session";
import {
  COMPANION_WRITING_COMPLETE_CARD_MESSAGE,
  COMPANION_WRITING_COMPLETE_FINISH_LABEL,
  COMPANION_WRITING_COMPLETE_GROW_LABEL,
} from "@/lib/journal/companionWriting/types";
import { journalPreviewPath } from "@/lib/journal/journalNav";
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
  payload: CompanionWritingCalendarCompletePayload;
  calendarReturnTo: string;
  onDismiss: () => void;
};

export function CompanionWritingCalendarCompleteCard({
  payload,
  calendarReturnTo,
  onDismiss,
}: Props) {
  const router = useRouter();
  const whisper = getCompanionWritingCalendarWhisper(payload.companionType);
  const faceAsset = getDecorationAsset(COMPANION_WRITING_APPRAISER_FACE[payload.companionType]);
  const faceTuning = COMPANION_FACE_TUNING[payload.companionType];

  const dismissGuide = () => {
    clearCompanionWritingCalendarComplete();
    onDismiss();
  };

  const goGrow = () => {
    const href = prepareCompanionWritingGrowNavigation({
      entryId: payload.entryId,
      entryDateYmd: payload.entryDateYmd,
      companionType: payload.companionType,
      profileId: payload.profileId,
    });
    dismissGuide();
    router.push(href);
  };

  const previewHref = journalPreviewPath(
    payload.entryId,
    payload.designTheme,
    calendarReturnTo,
    payload.profileId,
  );

  return (
    <CompanionWritingGuideStage ariaLabel={COMPANION_WRITING_COMPLETE_CARD_MESSAGE}>
      <CompanionWritingGuideCardShell>
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-emerald-100 bg-white shadow-sm">
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
              sizes="80px"
            />
          </div>
          <p className="text-center text-base font-semibold leading-relaxed text-emerald-950 sm:text-lg">
            {COMPANION_WRITING_COMPLETE_CARD_MESSAGE}
          </p>
          <p className="text-center text-xs font-semibold text-stone-600">{whisper.name}より</p>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          <button type="button" onClick={goGrow} className={companionWritingGuideSecondaryButtonClass}>
            {COMPANION_WRITING_COMPLETE_GROW_LABEL}
          </button>
          <a
            href={previewHref}
            onClick={() => {
              writeCompanionWritingPreviewGuide({
                version: 1,
                entryId: payload.entryId,
                companionType: payload.companionType,
                profileId: payload.profileId,
              });
              dismissGuide();
            }}
            className={companionWritingGuidePrimaryButtonClass}
          >
            {COMPANION_WRITING_COMPLETE_FINISH_LABEL}
          </a>
        </div>
      </CompanionWritingGuideCardShell>
    </CompanionWritingGuideStage>
  );
}
