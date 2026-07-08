"use client";

import { ForestResidentCard } from "@/components/guide/ForestResidentCard";
import { FirstVisitGuideCardPageLayout } from "@/components/guide/first-visit/FirstVisitGuideCardPageLayout";
import { FirstVisitMilestoneActions } from "@/components/guide/first-visit/FirstVisitMilestoneActions";
import {
  companionWritingGuideBodyClass,
  companionWritingGuideTitleClass,
} from "@/components/journal/companion-writing/companionWritingGuideStyles";
import type { ForestResidentCardData } from "@/lib/forestResident/forestResidentNumber";
import {
  FIRST_VISIT_RESIDENT_CARD_BODY,
  FIRST_VISIT_RESIDENT_CARD_EMAIL_NOTE,
  FIRST_VISIT_RESIDENT_CARD_GROWTH_HINT,
  FIRST_VISIT_RESIDENT_CARD_NEXT_BUTTON,
  FIRST_VISIT_RESIDENT_CARD_PAGE_TITLE,
} from "@/lib/onboarding/firstVisitWizard/residentCardCopy";

type Props = {
  card: ForestResidentCardData;
  showEmailNote: boolean;
  onNext: () => void;
};

/** 第5幕①：住民票カード発行（表示部分） */
export function FirstVisitResidentCardContent({ card, showEmailNote, onNext }: Props) {
  return (
    <FirstVisitGuideCardPageLayout
      stepLabel="住民票カード"
      ariaLabel="住民票カードが発行されました"
    >
      <div className="flex w-full flex-col items-center gap-5">
        <div className="w-full space-y-3 text-center lg:text-left">
          <h2 className={`${companionWritingGuideTitleClass} lg:text-center`}>
            {FIRST_VISIT_RESIDENT_CARD_PAGE_TITLE}
          </h2>
          <p className={`whitespace-pre-line ${companionWritingGuideBodyClass}`}>
            {FIRST_VISIT_RESIDENT_CARD_BODY}
          </p>
        </div>

        <ForestResidentCard {...card} />

        {showEmailNote ? (
          <p className="w-full whitespace-pre-line text-center text-xs leading-relaxed text-stone-500 lg:text-sm">
            {FIRST_VISIT_RESIDENT_CARD_EMAIL_NOTE}
          </p>
        ) : null}

        <p className="w-full text-center text-xs leading-relaxed text-stone-500">
          {FIRST_VISIT_RESIDENT_CARD_GROWTH_HINT}
        </p>

        <FirstVisitMilestoneActions
          nextLabel={FIRST_VISIT_RESIDENT_CARD_NEXT_BUTTON}
          onNext={onNext}
        />
      </div>
    </FirstVisitGuideCardPageLayout>
  );
}
