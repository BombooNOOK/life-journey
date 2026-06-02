"use client";

import Link from "next/link";

import type { BoundDiaryEntry } from "@/components/journal/DiaryYearBoundPages";
import { getActivityMeta } from "@/lib/journal/meta";
import {
  journalEntryLayoutLengthFlag,
  JOURNAL_LONG_CONTENT_WARN_MESSAGE,
  JOURNAL_VERY_LONG_CONTENT_WARN_MESSAGE,
} from "@/lib/journal/contentFontMode";

export type LongContentWarningEntry = {
  entry: BoundDiaryEntry;
  flag: "soft" | "strong";
};

export function collectLongContentWarningEntries(entries: BoundDiaryEntry[]): LongContentWarningEntry[] {
  const flagged: LongContentWarningEntry[] = [];
  for (const entry of entries) {
    if (entry.content.trim().length === 0) continue;
    const flag = journalEntryLayoutLengthFlag(entry.contentFontMode, entry.content);
    if (flag === "soft" || flag === "strong") {
      flagged.push({ entry, flag });
    }
  }
  return flagged.sort(
    (a, b) => new Date(a.entry.createdAt).getTime() - new Date(b.entry.createdAt).getTime(),
  );
}

function formatBindingDateLabel(createdAt: string): string {
  const d = new Date(createdAt);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

type Props = {
  /** 本に入れる対象など、確認したい記事一覧 */
  entries: BoundDiaryEntry[];
  buildPreviewHref: (entry: BoundDiaryEntry) => string;
};

export function JournalBindingContentWarnings({ entries, buildPreviewHref }: Props) {
  const flagged = collectLongContentWarningEntries(entries);
  if (flagged.length === 0) return null;

  const strongCount = flagged.filter((f) => f.flag === "strong").length;
  const softOnlyCount = flagged.filter((f) => f.flag === "soft").length;
  const hasStrong = strongCount > 0;
  const hasSoftOnly = softOnlyCount > 0;

  return (
    <div className="mb-3 space-y-3 rounded-lg border border-amber-200/90 bg-amber-50/60 px-3 py-3">
      {hasStrong ? (
        <p className="text-xs leading-relaxed text-orange-950">
          <span className="font-semibold">本文がかなり長い記事が {strongCount} 件あります。</span>
          <span className="mt-1 block">{JOURNAL_VERY_LONG_CONTENT_WARN_MESSAGE}</span>
        </p>
      ) : null}
      {hasSoftOnly ? (
        <p className="text-xs leading-relaxed text-amber-950">
          <span className="font-semibold">本文が長めの記事が {softOnlyCount} 件あります。</span>
          <span className="mt-1 block">製本前に、表示内容をご確認ください。</span>
          {!hasStrong ? (
            <span className="mt-1 block text-[11px] text-amber-900/90">
              {JOURNAL_LONG_CONTENT_WARN_MESSAGE}
            </span>
          ) : null}
        </p>
      ) : null}

      <div>
        <p className="text-xs font-medium text-amber-950">確認が必要な日記：</p>
        <ul className="mt-1.5 space-y-1">
          {flagged.map(({ entry, flag }) => (
            <li key={entry.id}>
              <Link
                href={buildPreviewHref(entry)}
                className="flex flex-wrap items-baseline gap-x-1.5 rounded px-1 py-0.5 text-xs text-amber-950 underline-offset-2 hover:bg-amber-100/80 hover:underline"
              >
                <span className="tabular-nums font-medium">{formatBindingDateLabel(entry.createdAt)}</span>
                <span>{getActivityMeta(entry.activity).label}</span>
                {flag === "strong" ? (
                  <span className="rounded bg-orange-200/80 px-1 py-0.5 text-[10px] font-medium text-orange-950">
                    かなり長い
                  </span>
                ) : (
                  <span className="rounded bg-amber-200/70 px-1 py-0.5 text-[10px] font-medium text-amber-950">
                    長文注意
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[10px] text-amber-900/80">
          プレビュー確認後は「一覧に戻る」でこの画面に戻れます。
        </p>
      </div>
    </div>
  );
}
