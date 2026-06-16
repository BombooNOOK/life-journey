"use client";

import { useId, useState } from "react";
import Link from "next/link";

import {
  JOURNAL_DIARY_NUMBERS_HELP_TEXT,
  JOURNAL_DIARY_NUMBERS_SECTION_TITLE,
  NUMEROLOGY_NUMBER_MEANINGS_LINK_LABEL,
} from "@/lib/journal/journalDiaryNumbersHelpCopy";
import { numerologyNumberMeaningsHref } from "@/lib/journal/numerologyNumbersNav";

type DiaryNumbers = {
  today: number;
  month: number;
  year: number;
};

type Props = {
  diaryNumbers: DiaryNumbers;
  /** 数字の意味ページから戻る先（日記プレビュー URL など） */
  meaningsReturnTo?: string | null;
};

export function DiaryNumbersHintSection({ diaryNumbers, meaningsReturnTo }: Props) {
  const [helpOpen, setHelpOpen] = useState(false);
  const helpPanelId = useId();

  return (
    <section className="rounded-xl border border-stone-200/80 bg-white/80 px-4 py-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-stone-700">{JOURNAL_DIARY_NUMBERS_SECTION_TITLE}</h3>
        <button
          type="button"
          aria-label={helpOpen ? "説明を閉じる" : "数字からのヒントの説明を表示"}
          aria-expanded={helpOpen}
          aria-controls={helpPanelId}
          onClick={() => setHelpOpen((prev) => !prev)}
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-stone-300/90 bg-[#faf8f5] text-[11px] font-medium leading-none text-stone-500 transition hover:border-stone-400 hover:bg-white hover:text-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
        >
          ?
        </button>
      </div>

      {helpOpen ? (
        <div
          id={helpPanelId}
          role="region"
          className="mt-3 w-full rounded-lg border border-stone-200/90 bg-[#faf8f5] px-3 py-3 lj-read-desc text-stone-700"
        >
          <p className="whitespace-pre-line">{JOURNAL_DIARY_NUMBERS_HELP_TEXT}</p>
        </div>
      ) : null}

      <dl className="lj-read-body mt-3 space-y-2 text-stone-800">
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-stone-600">今日の数字：</dt>
          <dd className="font-medium">{diaryNumbers.today}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-stone-600">月の数字：</dt>
          <dd className="font-medium">{diaryNumbers.month}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-stone-600">年の数字：</dt>
          <dd className="font-medium">{diaryNumbers.year}</dd>
        </div>
      </dl>

      <p className="mt-4">
        <Link
          href={numerologyNumberMeaningsHref(meaningsReturnTo)}
          className="inline-flex min-h-[44px] items-center text-base font-medium text-emerald-900 underline-offset-2 hover:underline"
        >
          {NUMEROLOGY_NUMBER_MEANINGS_LINK_LABEL}
        </Link>
      </p>
    </section>
  );
}
