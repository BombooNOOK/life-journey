"use client";

import { CharacterFaceIcon } from "@/components/home/CharacterFaceIcon";
import {
  FIRST_VISIT_PATH_GUIDE_WRITING_HABIT_BODY,
  FIRST_VISIT_PATH_GUIDE_WRITING_HABIT_DISMISS,
  FIRST_VISIT_PATH_GUIDE_WRITING_HABIT_OWL_QUOTE,
} from "@/lib/onboarding/firstVisitWizard/chapter3WritingCopy";

type Props = {
  onDismiss: () => void;
};

/** 道しるべ3章完了後：ログハウスからの日記の書き方（フクロウ先生） */
export function FirstVisitPathGuideWritingHabitCard({ onDismiss }: Props) {
  return (
    <section
      aria-labelledby="path-guide-writing-habit-heading"
      className="rounded-xl border border-emerald-200/70 bg-[#fffdf9] px-4 py-4 shadow-sm sm:px-5 sm:py-5"
    >
      <h2 id="path-guide-writing-habit-heading" className="sr-only">
        あしあとの残し方のご案内
      </h2>
      <div className="flex items-start gap-2.5 sm:gap-3">
        <CharacterFaceIcon name="character-owl-face" />
        <div className="min-w-0 flex-1">
          <p className="whitespace-pre-line text-[0.95em] leading-relaxed text-stone-600">
            {FIRST_VISIT_PATH_GUIDE_WRITING_HABIT_OWL_QUOTE}
          </p>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-stone-700">
            {FIRST_VISIT_PATH_GUIDE_WRITING_HABIT_BODY}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="mt-4 inline-flex min-h-[40px] w-full items-center justify-center rounded-lg border border-emerald-200/80 bg-white px-4 py-2 text-sm font-medium text-emerald-950 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/90"
      >
        {FIRST_VISIT_PATH_GUIDE_WRITING_HABIT_DISMISS}
      </button>
    </section>
  );
}
