"use client";

import {
  companionWritingGuideBodyClass,
  companionWritingGuidePrimaryButtonClass,
  companionWritingGuideTitleClass,
} from "@/components/journal/companion-writing/companionWritingGuideStyles";
import {
  FIRST_VISIT_RESIDENT_REGISTRATION_INTRO_BODY,
  FIRST_VISIT_RESIDENT_REGISTRATION_INTRO_BUTTON,
  FIRST_VISIT_RESIDENT_REGISTRATION_INTRO_FOOTNOTE,
  FIRST_VISIT_RESIDENT_REGISTRATION_INTRO_LEAD,
} from "@/lib/onboarding/firstVisitWizard/residentRegistrationCopy";

type Props = {
  onNext: () => void;
};

/** 住民登録フォーム前に表示する、テキスト中心の説明カード */
export function FirstVisitResidentRegistrationIntroOverlay({ onNext }: Props) {
  return (
    <div
      className="overflow-hidden rounded-2xl shadow-[0_14px_44px_-14px_rgba(24,83,53,0.2)] ring-1 ring-emerald-100/90"
      style={{
        borderWidth: 1.5,
        borderStyle: "solid",
        borderColor: "rgba(16, 120, 80, 0.22)",
        backgroundColor: "#fffbf5",
      }}
      role="dialog"
      aria-labelledby="first-visit-resident-intro-lead"
      aria-describedby="first-visit-resident-intro-body first-visit-resident-intro-footnote"
    >
      <div className="h-1.5 bg-[#6b9080]" aria-hidden />
      <div className="px-5 pb-6 pt-5 sm:px-6 sm:pb-7 sm:pt-6">
        <p id="first-visit-resident-intro-lead" className={companionWritingGuideTitleClass}>
          {FIRST_VISIT_RESIDENT_REGISTRATION_INTRO_LEAD}
        </p>
        <p
          id="first-visit-resident-intro-body"
          className={`mt-3 whitespace-pre-line ${companionWritingGuideBodyClass}`}
        >
          {FIRST_VISIT_RESIDENT_REGISTRATION_INTRO_BODY}
        </p>
        <p
          id="first-visit-resident-intro-footnote"
          className="mt-4 text-xs leading-relaxed text-stone-500"
        >
          {FIRST_VISIT_RESIDENT_REGISTRATION_INTRO_FOOTNOTE}
        </p>
        <button
          type="button"
          className={`mt-5 ${companionWritingGuidePrimaryButtonClass}`}
          onClick={onNext}
        >
          {FIRST_VISIT_RESIDENT_REGISTRATION_INTRO_BUTTON}
        </button>
      </div>
    </div>
  );
}
