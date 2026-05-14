"use client";

import type { BoundDiaryEntry } from "@/components/journal/DiaryYearBoundPages";
import {
  isJournalContentOverSoftLimit,
  isJournalContentStrongLong,
  JOURNAL_LONG_CONTENT_WARN_MESSAGE,
  JOURNAL_VERY_LONG_CONTENT_WARN_MESSAGE,
  normalizeContentFontMode,
} from "@/lib/journal/contentFontMode";

type Props = {
  /** 本に入れる対象など、確認したい記事一覧 */
  entries: BoundDiaryEntry[];
};

export function JournalBindingContentWarnings({ entries }: Props) {
  let strongCount = 0;
  let softOnlyCount = 0;
  for (const e of entries) {
    const len = e.content.trim().length;
    if (len === 0) continue;
    const mode = normalizeContentFontMode(e.contentFontMode);
    if (isJournalContentStrongLong(mode, len)) {
      strongCount += 1;
    } else if (isJournalContentOverSoftLimit(mode, len)) {
      softOnlyCount += 1;
    }
  }

  if (strongCount === 0 && softOnlyCount === 0) return null;

  return (
    <div className="mb-3 space-y-2 rounded-lg border border-amber-200/90 bg-amber-50/60 px-3 py-3">
      {strongCount > 0 ? (
        <p className="text-xs leading-relaxed text-orange-950">
          <span className="font-semibold">本文がかなり長い記事が {strongCount} 件あります。</span>
          <span className="mt-1 block">{JOURNAL_VERY_LONG_CONTENT_WARN_MESSAGE}</span>
        </p>
      ) : null}
      {softOnlyCount > 0 ? (
        <p className="text-xs leading-relaxed text-amber-950">
          <span className="font-semibold">本文が長めの記事が {softOnlyCount} 件あります。</span>
          <span className="mt-1 block">{JOURNAL_LONG_CONTENT_WARN_MESSAGE}</span>
        </p>
      ) : null}
    </div>
  );
}
