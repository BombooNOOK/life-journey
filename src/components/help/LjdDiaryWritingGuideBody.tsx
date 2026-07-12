"use client";

import type { ReactNode } from "react";

import { GuideAppLink } from "@/components/help/GuideAppLink";
import { LjdDiaryWritingGuideCalendarPreview } from "@/components/help/LjdDiaryWritingGuideCalendarPreview";
import { LjdDiaryWritingGuideLogHousePreview } from "@/components/help/LjdDiaryWritingGuideLogHousePreview";
import { CompanionWritingButtonLabel } from "@/components/journal/companion-writing/CompanionWritingButtonLabel";
import {
  LJD_DIARY_WRITING_GUIDE_CHOOSE_ACTION,
  LJD_DIARY_WRITING_GUIDE_CHOOSE_COMPANION,
  LJD_DIARY_WRITING_GUIDE_CHOOSE_SOLO,
  LJD_DIARY_WRITING_GUIDE_CALENDAR_HUB,
  LJD_DIARY_WRITING_GUIDE_COMMON_STEPS,
  LJD_DIARY_WRITING_GUIDE_COMPANION_FLOW,
  LJD_DIARY_WRITING_GUIDE_COMPANION_SECTION_TITLE,
  LJD_DIARY_WRITING_GUIDE_COMPANION_TODAY_NOTE,
  LJD_DIARY_WRITING_GUIDE_DETAILS_ITEMS,
  LJD_DIARY_WRITING_GUIDE_DETAILS_TITLE,
  LJD_DIARY_WRITING_GUIDE_LEAD,
  LJD_DIARY_WRITING_GUIDE_NORMAL_CALENDAR_NOTE,
  LJD_DIARY_WRITING_GUIDE_NORMAL_FLOW,
  LJD_DIARY_WRITING_GUIDE_NORMAL_SECTION_TITLE,
  type LjdDiaryWritingGuideStep,
} from "@/lib/help/ljdDiaryWritingGuideCopy";
import { LOG_HOUSE_MAIN_ACTIONS_HREF, LOG_HOUSE_OPEN_LABEL } from "@/lib/journal/logHouseLabels";
import { journalWithCompanionPath } from "@/lib/journal/journalNav";

export type LjdDiaryWritingGuideBodyVariant = "dictionary" | "firstJournal";

type Props = {
  variant?: LjdDiaryWritingGuideBodyVariant;
  showLogHousePreview?: boolean;
  emphasizeCompanion?: boolean;
  prelude?: ReactNode;
};

const companionWritingGuideHref = journalWithCompanionPath("/orders");

function GuideStepList({
  steps,
  startIndex = 1,
}: {
  steps: readonly LjdDiaryWritingGuideStep[];
  startIndex?: number;
}) {
  return (
    <ol className="space-y-2.5">
      {steps.map((step, index) => (
        <li key={step.id}>
          <div className="rounded-lg border border-stone-100 bg-[#fffdf9] px-3 py-3 sm:px-4">
            <p className="text-xs font-semibold text-emerald-800/90">
              {startIndex + index}. {step.title}
            </p>
            <p className="mt-1.5 text-sm leading-6 text-stone-700">{step.body}</p>
            {step.note ? (
              <p className="mt-2 text-xs leading-relaxed text-stone-500">{step.note}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function GuideFlowSection({
  title,
  note,
  steps,
  startIndex,
  children,
}: {
  title: string;
  note?: string;
  steps: readonly LjdDiaryWritingGuideStep[];
  startIndex: number;
  children?: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-stone-200/80 bg-white px-3 py-4 sm:px-4">
      <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      {note ? <p className="text-xs leading-relaxed text-stone-500">{note}</p> : null}
      <GuideStepList steps={steps} startIndex={startIndex} />
      {children}
    </section>
  );
}

/** 森の案内所④「日記の書き方」本文（辞書トーン・他画面と共有） */
export function LjdDiaryWritingGuideBody({
  variant = "dictionary",
  showLogHousePreview = true,
  emphasizeCompanion = true,
  prelude = null,
}: Props) {
  const commonCount = LJD_DIARY_WRITING_GUIDE_COMMON_STEPS.length;

  return (
    <div className="space-y-4">
      {prelude}

      <p>{LJD_DIARY_WRITING_GUIDE_LEAD}</p>

      <GuideStepList steps={LJD_DIARY_WRITING_GUIDE_COMMON_STEPS} />

      <div className="rounded-lg border border-stone-100 bg-[#fffdf9] px-3 py-3 sm:px-4">
        <p className="text-xs font-semibold text-emerald-800/90">
          {commonCount + 1}. {LJD_DIARY_WRITING_GUIDE_CHOOSE_ACTION.title}
        </p>
        <p className="mt-1.5 text-sm leading-6 text-stone-700">
          {LJD_DIARY_WRITING_GUIDE_CHOOSE_ACTION.body}
        </p>
        <ul className="mt-2.5 space-y-1.5 text-sm leading-6 text-stone-700">
          <li>・{LJD_DIARY_WRITING_GUIDE_CHOOSE_COMPANION}</li>
          <li>・{LJD_DIARY_WRITING_GUIDE_CHOOSE_SOLO}</li>
        </ul>
      </div>

      {showLogHousePreview ? (
        <LjdDiaryWritingGuideLogHousePreview emphasizeCompanion={emphasizeCompanion} />
      ) : null}

      <GuideFlowSection
        title={LJD_DIARY_WRITING_GUIDE_COMPANION_SECTION_TITLE}
        note={LJD_DIARY_WRITING_GUIDE_COMPANION_TODAY_NOTE}
        steps={LJD_DIARY_WRITING_GUIDE_COMPANION_FLOW}
        startIndex={1}
      >
        <GuideAppLink
          href={companionWritingGuideHref}
          label={<CompanionWritingButtonLabel />}
          feature="guide_companion"
        />
      </GuideFlowSection>

      <GuideFlowSection
        title={LJD_DIARY_WRITING_GUIDE_NORMAL_SECTION_TITLE}
        note={`${LJD_DIARY_WRITING_GUIDE_CALENDAR_HUB} ${LJD_DIARY_WRITING_GUIDE_NORMAL_CALENDAR_NOTE}`}
        steps={LJD_DIARY_WRITING_GUIDE_NORMAL_FLOW}
        startIndex={1}
      >
        <LjdDiaryWritingGuideCalendarPreview />
        <GuideAppLink href="/orders/calendar" label="カレンダーから日記を書く" feature="guide_calendar" />
      </GuideFlowSection>

      <details className="group rounded-lg border border-stone-200/80 bg-white">
        <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-medium text-stone-700 marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between gap-2">
            <span>{LJD_DIARY_WRITING_GUIDE_DETAILS_TITLE}</span>
            <span
              className="text-xs font-normal text-stone-400 transition group-open:rotate-180"
              aria-hidden
            >
              ▼
            </span>
          </span>
        </summary>
        <ul className="space-y-2.5 border-t border-stone-100 px-3 py-3">
          {LJD_DIARY_WRITING_GUIDE_DETAILS_ITEMS.map((item) => (
            <li key={item.title}>
              <p className="text-sm font-medium text-stone-800">{item.title}</p>
              <p className="mt-0.5 text-sm leading-6 text-stone-600">{item.body}</p>
            </li>
          ))}
        </ul>
      </details>

      <GuideAppLink href="/orders" label={LOG_HOUSE_OPEN_LABEL} feature="guide_loghouse" />
      {variant === "dictionary" ? (
        <GuideAppLink href={LOG_HOUSE_MAIN_ACTIONS_HREF} label="ログハウスの②を開く" feature="guide_loghouse" />
      ) : null}
    </div>
  );
}
