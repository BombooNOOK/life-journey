"use client";

import { Suspense, useState } from "react";

import { DiaryBookFlipReader } from "@/components/journal/DiaryBookFlipReader";
import { BookshelfEditIncludesNavButton } from "@/components/orders/BookshelfEditIncludesNavButton";
import { BookshelfEditPeriodNavButton } from "@/components/orders/BookshelfEditPeriodNavButton";
import { DiaryBookDeleteButton } from "@/components/orders/DiaryBookDeleteButton";

type Props = {
  bookId: string;
  title: string;
  startDate: string;
  endDate: string;
  coverTheme: string;
  profileId: string;
  rangeLabel: string;
  entryCount: number;
  initialNeedsContentRefresh: boolean;
  showEditIncludes: boolean;
  showEditPeriod?: boolean;
};

export function DiaryBookReadView({
  bookId,
  title,
  startDate,
  endDate,
  coverTheme,
  profileId,
  rangeLabel,
  entryCount,
  initialNeedsContentRefresh,
  showEditIncludes,
  showEditPeriod = false,
}: Props) {
  const [needsContentRefresh, setNeedsContentRefresh] = useState(initialNeedsContentRefresh);

  return (
    <>
      <p className="mt-1 text-sm text-stone-600">
        {rangeLabel} · {entryCount}件の日記
        {needsContentRefresh ? (
          <span className="ml-2 inline-flex shrink-0 whitespace-nowrap rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900">
            更新が必要
          </span>
        ) : null}
      </p>
      {showEditIncludes ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
          {showEditPeriod ? (
            <BookshelfEditPeriodNavButton bookId={bookId} />
          ) : null}
          <BookshelfEditIncludesNavButton
            bookId={bookId}
            className="text-sm font-medium text-emerald-800 underline-offset-2 hover:underline"
          />
          <DiaryBookDeleteButton bookId={bookId} bookTitle={title} />
        </div>
      ) : null}
      <Suspense fallback={<p className="text-sm text-stone-500">日記ブックを読み込み中…</p>}>
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
