"use client";

import { Suspense, useState } from "react";

import { DiaryBookFlipReader } from "@/components/journal/DiaryBookFlipReader";
import { OwlSuspenseFallback } from "@/components/ui/OwlSuspenseFallback";

type Props = {
  bookId: string;
  title: string;
  startDate: string;
  endDate: string;
  coverTheme: string;
  pageTemplate?: string;
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
  pageTemplate,
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
        {rangeLabel} · {entryCount}件のあしあと
        {needsContentRefresh ? (
          <span className="ml-2 inline-flex shrink-0 whitespace-nowrap rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900">
            更新が必要
          </span>
        ) : null}
      </p>
      <Suspense fallback={<OwlSuspenseFallback label="あしあとブックを読み込んでいます…" />}>
        <DiaryBookFlipReader
          bookId={bookId}
          title={title}
          startDate={startDate}
          endDate={endDate}
          coverTheme={coverTheme}
          pageTemplate={pageTemplate}
          profileId={profileId}
          initialNeedsContentRefresh={initialNeedsContentRefresh}
          onNeedsContentRefreshChange={setNeedsContentRefresh}
          showEditIncludes={showEditIncludes}
          showEditPeriod={showEditPeriod}
        />
      </Suspense>
    </>
  );
}
