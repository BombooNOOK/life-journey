"use client";

import { Suspense, useState } from "react";

import { DiaryBookFlipReader } from "@/components/journal/DiaryBookFlipReader";
import { BookshelfEditIncludesNavButton } from "@/components/orders/BookshelfEditIncludesNavButton";
import { BookshelfEditPeriodNavButton } from "@/components/orders/BookshelfEditPeriodNavButton";
import { BookshelfEditTagsNavButton } from "@/components/orders/BookshelfEditTagsNavButton";
import { DiaryBookDeleteButton } from "@/components/orders/DiaryBookDeleteButton";
import { OwlSuspenseFallback } from "@/components/ui/OwlSuspenseFallback";
import { formatDiaryBookTagScopeSummary } from "@/lib/journal/diaryBookTagFilter";
import type { DiaryBookTagFilterMode } from "@/lib/journal/diaryTags";

type Props = {
  bookId: string;
  title: string;
  startDate: string;
  endDate: string;
  coverTheme: string;
  profileId: string;
  rangeLabel: string;
  tagFilter: string;
  tagFilterMode: DiaryBookTagFilterMode;
  entryCount: number;
  initialNeedsContentRefresh: boolean;
  showEditIncludes: boolean;
  showEditPeriod?: boolean;
  showEditTags?: boolean;
};

export function DiaryBookReadView({
  bookId,
  title,
  startDate,
  endDate,
  coverTheme,
  profileId,
  rangeLabel,
  tagFilter,
  tagFilterMode,
  entryCount,
  initialNeedsContentRefresh,
  showEditIncludes,
  showEditPeriod = false,
  showEditTags = false,
}: Props) {
  const [needsContentRefresh, setNeedsContentRefresh] = useState(initialNeedsContentRefresh);
  const tagScopeSummary = formatDiaryBookTagScopeSummary({ tagFilter, tagFilterMode });

  return (
    <>
      <div className="mt-1 space-y-0.5 text-sm text-stone-600">
        <p>
          対象期間：{rangeLabel}
          {needsContentRefresh ? (
            <span className="ml-2 inline-flex shrink-0 whitespace-nowrap rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900">
              更新が必要
            </span>
          ) : null}
        </p>
        {tagScopeSummary ? <p>タグ条件：{tagScopeSummary}</p> : null}
        <p>掲載日記：{entryCount}件</p>
      </div>
      {showEditIncludes ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
          {showEditPeriod ? (
            <BookshelfEditPeriodNavButton bookId={bookId} />
          ) : null}
          {showEditTags ? <BookshelfEditTagsNavButton bookId={bookId} /> : null}
          <BookshelfEditIncludesNavButton
            bookId={bookId}
            className="text-sm font-medium text-emerald-800 underline-offset-2 hover:underline"
          >
            掲載する日記を選ぶ
          </BookshelfEditIncludesNavButton>
          <DiaryBookDeleteButton bookId={bookId} bookTitle={title} />
        </div>
      ) : null}
      <Suspense fallback={<OwlSuspenseFallback label="日記ブックを読み込んでいます…" />}>
        <DiaryBookFlipReader
          bookId={bookId}
          title={title}
          startDate={startDate}
          endDate={endDate}
          coverTheme={coverTheme}
          profileId={profileId}
          initialNeedsContentRefresh={initialNeedsContentRefresh}
          onNeedsContentRefreshChange={setNeedsContentRefresh}
        />
      </Suspense>
    </>
  );
}
