"use client";

import {
  companionWritingGuidePrimaryButtonClass,
  companionWritingGuideSecondaryButtonClass,
} from "@/components/journal/companion-writing/companionWritingGuideStyles";
import { useTransitionNavigation } from "@/components/ui/TransitionNavigationProvider";
import { FIRST_VISIT_PAUSE_LINK_HREF } from "@/lib/onboarding/firstVisitWizard/backBlockCopy";
import { FIRST_VISIT_MILESTONE_HOME_BUTTON } from "@/lib/onboarding/firstVisitWizard/milestoneCopy";

type Props = {
  nextLabel: string;
  onNext: () => void;
  homeLabel?: string;
};

/** 区切りページ：次へ ＋ 森の入口へ（戻るではなく中断） */
export function FirstVisitMilestoneActions({
  nextLabel,
  onNext,
  homeLabel = FIRST_VISIT_MILESTONE_HOME_BUTTON,
}: Props) {
  const { replace, isPending } = useTransitionNavigation();

  return (
    <div className="flex w-full flex-col gap-2.5">
      <button
        type="button"
        className={companionWritingGuidePrimaryButtonClass}
        disabled={isPending}
        onClick={onNext}
      >
        {nextLabel}
      </button>
      <button
        type="button"
        className={companionWritingGuideSecondaryButtonClass}
        disabled={isPending}
        onClick={() => replace(FIRST_VISIT_PAUSE_LINK_HREF)}
      >
        {homeLabel}
      </button>
    </div>
  );
}
