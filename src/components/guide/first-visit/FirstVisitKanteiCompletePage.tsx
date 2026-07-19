"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

import {
  companionWritingGuideBodyClass,
  companionWritingGuidePrimaryButtonClass,
  companionWritingGuideSecondaryButtonClass,
  companionWritingGuideTitleClass,
} from "@/components/journal/companion-writing/companionWritingGuideStyles";
import { useTransitionNavigation } from "@/components/ui/TransitionNavigationProvider";
import { pinFirstVisitWizardHistory } from "@/hooks/useBlockBrowserBack";
import {
  FIRST_VISIT_KANTEI_COMPLETE_BODY,
  FIRST_VISIT_KANTEI_COMPLETE_LOGHOUSE,
  FIRST_VISIT_KANTEI_COMPLETE_PRIMARY,
  FIRST_VISIT_KANTEI_COMPLETE_SECONDARY,
  FIRST_VISIT_KANTEI_COMPLETE_TITLE,
} from "@/lib/onboarding/firstVisitWizard/kanteiCompleteCopy";
import { FIRST_VISIT_CHAPTER_3_SIGN_HREF } from "@/lib/onboarding/firstVisitWizard/chapters";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import {
  clearFirstVisitKanteiVideoOrderId,
  clearBookshelfKanteiGuideFlag,
  setFirstVisitChapterCompleteFlag,
} from "@/lib/onboarding/firstVisitWizard/session";

/** 第2章完了：鑑定書は本棚・ポストへ。次は第3章 */
export function FirstVisitKanteiCompletePage() {
  const router = useRouter();
  const { replace, isPending } = useTransitionNavigation();

  useEffect(() => {
    pinFirstVisitWizardHistory();
    clearFirstVisitKanteiVideoOrderId();
    clearBookshelfKanteiGuideFlag();
    setFirstVisitChapterCompleteFlag(2);
  }, []);

  const goDiary = useCallback(() => {
    replace(FIRST_VISIT_CHAPTER_3_SIGN_HREF);
  }, [replace]);

  const goDoneForToday = useCallback(() => {
    replace(FIRST_VISIT_ROUTES.pathGuide);
  }, [replace]);

  const goLoghouse = useCallback(() => {
    replace("/orders");
    router.refresh();
  }, [replace, router]);

  return (
    <section
      className="flex min-h-[100dvh] flex-col bg-gradient-to-b from-[#faf8f5] via-[#f7f4ef] to-[#f3efe8]"
      aria-labelledby="first-visit-kantei-complete-heading"
    >
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="w-full max-w-md">
          <h1
            id="first-visit-kantei-complete-heading"
            className={`text-center ${companionWritingGuideTitleClass}`}
          >
            {FIRST_VISIT_KANTEI_COMPLETE_TITLE}
          </h1>

          <p
            className={`mt-4 whitespace-pre-line text-center leading-relaxed ${companionWritingGuideBodyClass}`}
          >
            {FIRST_VISIT_KANTEI_COMPLETE_BODY}
          </p>

          <div className="mt-6 flex w-full flex-col gap-2.5">
            <button
              type="button"
              className={companionWritingGuidePrimaryButtonClass}
              disabled={isPending}
              onClick={goDiary}
            >
              {FIRST_VISIT_KANTEI_COMPLETE_PRIMARY}
            </button>
            <button
              type="button"
              className={companionWritingGuideSecondaryButtonClass}
              disabled={isPending}
              onClick={goDoneForToday}
            >
              {FIRST_VISIT_KANTEI_COMPLETE_SECONDARY}
            </button>
            <button
              type="button"
              className={companionWritingGuideSecondaryButtonClass}
              disabled={isPending}
              onClick={goLoghouse}
            >
              {FIRST_VISIT_KANTEI_COMPLETE_LOGHOUSE}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
