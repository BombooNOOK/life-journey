"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { CompanionWritingGuideCardShell } from "@/components/journal/companion-writing/CompanionWritingGuideCardShell";
import { CompanionWritingGuideStage } from "@/components/journal/companion-writing/CompanionWritingGuideStage";
import {
  companionWritingGuidePrimaryButtonClass,
  companionWritingGuideSecondaryButtonClass,
} from "@/components/journal/companion-writing/companionWritingGuideStyles";
import { getCompanionWritingCalendarWhisper } from "@/lib/journal/companionWriting/guideWhispers";
import { diaryBookEntryCompanionImagePath } from "@/lib/journal/diaryBookEntryAssets";
import {
  clearCompanionWritingCalendarComplete,
  prepareCompanionWritingEditNavigation,
  type CompanionWritingCalendarCompletePayload,
} from "@/lib/journal/companionWriting/session";
import {
  COMPANION_WRITING_CALENDAR_GUIDE_BODY,
  COMPANION_WRITING_CALENDAR_GUIDE_NEXT_LABEL,
  COMPANION_WRITING_CALENDAR_GUIDE_TITLE,
  type CompanionWritingCalendarGuidePhase,
} from "@/lib/journal/companionWriting/types";
import { journalPreviewPath } from "@/lib/journal/journalNav";

type CardPhase = Extract<CompanionWritingCalendarGuidePhase, "intro" | "actions">;

type Props = {
  payload: CompanionWritingCalendarCompletePayload;
  phase: CardPhase;
  calendarReturnTo: string;
  onIntroComplete: () => void;
  onDismiss: () => void;
};

export function CompanionWritingCalendarCompleteCard({
  payload,
  phase,
  calendarReturnTo,
  onIntroComplete,
  onDismiss,
}: Props) {
  const router = useRouter();
  const whisper = getCompanionWritingCalendarWhisper(payload.companionType);
  const companionImagePath = diaryBookEntryCompanionImagePath(payload.companionType);

  const dismissGuide = () => {
    clearCompanionWritingCalendarComplete();
    onDismiss();
  };

  const goPhoto = () => {
    const href = prepareCompanionWritingEditNavigation({
      entryId: payload.entryId,
      entryDateYmd: payload.entryDateYmd,
      companionType: payload.companionType,
      focus: "photo",
      profileId: payload.profileId,
    });
    dismissGuide();
    router.push(href);
  };

  const goBody = () => {
    const href = prepareCompanionWritingEditNavigation({
      entryId: payload.entryId,
      entryDateYmd: payload.entryDateYmd,
      companionType: payload.companionType,
      focus: "body",
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

  if (phase === "intro") {
    return (
      <CompanionWritingGuideStage>
        <CompanionWritingGuideCardShell>
          <p className="text-center text-base font-semibold leading-relaxed text-emerald-950 sm:text-lg">
            {COMPANION_WRITING_CALENDAR_GUIDE_TITLE}
          </p>
          <p className="mt-2 text-center text-sm leading-relaxed text-stone-700">
            {COMPANION_WRITING_CALENDAR_GUIDE_BODY}
          </p>
          <button
            type="button"
            onClick={onIntroComplete}
            className={`${companionWritingGuidePrimaryButtonClass} mt-5`}
          >
            {COMPANION_WRITING_CALENDAR_GUIDE_NEXT_LABEL}
          </button>
        </CompanionWritingGuideCardShell>
      </CompanionWritingGuideStage>
    );
  }

  return (
    <CompanionWritingGuideStage>
      <CompanionWritingGuideCardShell>
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-emerald-100 bg-white shadow-sm">
            <Image
              src={companionImagePath}
              alt=""
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
          <p className="text-center text-sm leading-relaxed text-stone-700">{whisper.message}</p>
          <p className="text-center text-xs font-semibold text-stone-600">{whisper.name}より</p>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          <button type="button" onClick={goPhoto} className={companionWritingGuideSecondaryButtonClass}>
            今日の思い出の写真を選ぶ
          </button>
          <button type="button" onClick={goBody} className={companionWritingGuideSecondaryButtonClass}>
            もっときもちを残す
          </button>
          <a
            href={previewHref}
            onClick={dismissGuide}
            className={companionWritingGuidePrimaryButtonClass}
          >
            今日の1ページを見ておしまい
          </a>
        </div>
      </CompanionWritingGuideCardShell>
    </CompanionWritingGuideStage>
  );
}
