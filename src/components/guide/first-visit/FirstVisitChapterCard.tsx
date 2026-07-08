"use client";

import type { ChapterCardViewModel } from "@/lib/onboarding/firstVisitWizard/chapterProgress";
import { FirstVisitWizardLink } from "@/components/guide/first-visit/FirstVisitWizardLink";

type Props = {
  chapter: ChapterCardViewModel;
  onAction?: () => void;
};

const cardBaseClass =
  "rounded-2xl border px-4 py-4 transition sm:px-5 sm:py-5";

function cardStateClass(status: ChapterCardViewModel["status"]): string {
  if (status === "locked") {
    return "border-stone-200/80 bg-stone-50/60 opacity-60";
  }
  if (status === "complete") {
    return "border-stone-200 bg-stone-100/70";
  }
  if (status === "in_progress") {
    return "border-emerald-300 bg-gradient-to-br from-emerald-50/90 via-white to-amber-50/50 shadow-sm";
  }
  return "border-emerald-200/80 bg-white shadow-sm";
}

const buttonClass =
  "inline-flex min-h-[44px] w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60";

function buttonStateClass(status: ChapterCardViewModel["status"]): string {
  if (status === "in_progress") {
    return "bg-emerald-800 text-white hover:bg-emerald-900 active:bg-emerald-950";
  }
  if (status === "available") {
    return "border border-emerald-700 bg-emerald-800 text-white hover:bg-emerald-900";
  }
  if (status === "complete") {
    return "border border-emerald-200 bg-white text-emerald-950 hover:bg-emerald-50/80";
  }
  return "";
}

/** はじめての道しるべ：章カード */
export function FirstVisitChapterCard({ chapter, onAction }: Props) {
  const showButton = chapter.buttonLabel != null && chapter.actionHref != null;
  const isLocked = chapter.status === "locked";
  const isCompleteWithoutAction = chapter.status === "complete" && !showButton;

  return (
    <article className={`${cardBaseClass} ${cardStateClass(chapter.status)}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/90">
        {chapter.label}
      </p>
      <h2 className="mt-1 text-base font-semibold text-stone-900 sm:text-lg">{chapter.title}</h2>
      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-stone-600">
        {chapter.description}
      </p>
      <p className="mt-2 text-xs font-medium text-stone-500">目安：{chapter.timeEstimate}</p>

      <div className="mt-4">
        {showButton ? (
          <FirstVisitWizardLink
            href={chapter.actionHref!}
            onNavigate={onAction}
            className={`${buttonClass} ${buttonStateClass(chapter.status)}`}
          >
            {chapter.buttonLabel}
          </FirstVisitWizardLink>
        ) : isLocked ? (
          <p className="text-center text-sm text-stone-500">{chapter.statusLabel}</p>
        ) : isCompleteWithoutAction ? (
          <p className="text-center text-sm font-medium text-stone-500">{chapter.statusLabel}</p>
        ) : null}
      </div>
    </article>
  );
}
