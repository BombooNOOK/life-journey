"use client";

import Image from "next/image";

import {
  DIARY_PREVIEW_PAGE_HEIGHT,
  DIARY_PREVIEW_PAGE_WIDTH,
} from "@/lib/journal/diaryPreviewFixedLayout";
import {
  diaryBookBackCoverImagePath,
  diaryBookFreeWritingLeftImagePath,
  diaryBookFreeWritingRightImagePath,
  diaryBookInsideCoverBackIllustrationImagePath,
  diaryBookInsideCoverImagePath,
  diaryBookMonthBodyOddAdjustmentIllustrationImagePath,
  diaryBookMonthIllustrationImagePath,
  diaryBookNumerologyQuickReferenceImagePath,
  diaryBookPreBackCoverIllustrationImagePath,
} from "@/lib/journal/diaryBookAssets";
import { DIARY_BOOK_INSIDE_COVER_TEXT } from "@/lib/journal/diaryBookInsideCoverLayout";
import { diaryCoverImagePath, getDiaryCoverStyleLabel, normalizeDiaryCoverStyle } from "@/lib/journal/coverAssets";
import {
  DiaryBoundMonthCalendarPage,
  type BoundDiaryEntry,
} from "@/components/journal/DiaryYearBoundPages";

const PAGE_STYLE = {
  width: DIARY_PREVIEW_PAGE_WIDTH,
  height: DIARY_PREVIEW_PAGE_HEIGHT,
} as const;

export function DiaryBookFrontCoverPage({
  coverTheme,
}: {
  coverTheme?: string;
}) {
  const coverStyle = normalizeDiaryCoverStyle(coverTheme);
  const coverSrc = diaryCoverImagePath(coverStyle, "owl");
  return (
    <div className="relative overflow-hidden bg-[#f7f4ee]" style={PAGE_STYLE}>
      <Image
        src={coverSrc}
        alt={`あしあとブック・表紙（${getDiaryCoverStyleLabel(coverStyle)}）`}
        fill
        className="object-cover"
        sizes="540px"
        priority
      />
    </div>
  );
}

export function DiaryBookInsideCoverPage({
  title,
  startDate,
  endDate,
}: {
  title: string;
  startDate: string;
  endDate: string;
}) {
  const periodLabel = `${startDate.replace(/-/g, "/")} 〜 ${endDate.replace(/-/g, "/")}`;
  return (
    <div
      className="relative overflow-hidden bg-white [container-type:inline-size]"
      style={PAGE_STYLE}
    >
      <Image
        src={diaryBookInsideCoverImagePath()}
        alt="あしあとブック・中表紙"
        fill
        className="object-cover"
        sizes="540px"
      />
      <div className="absolute inset-0 z-10 flex flex-col items-center px-[10%] text-center text-stone-800">
        <h2
          className="absolute left-0 right-0 font-semibold leading-snug tracking-wide"
          style={{
            top: DIARY_BOOK_INSIDE_COVER_TEXT.titleTop,
            fontSize: DIARY_BOOK_INSIDE_COVER_TEXT.titleFontSize,
          }}
        >
          {title}
        </h2>
        <p
          className="absolute left-0 right-0 text-stone-600"
          style={{
            top: DIARY_BOOK_INSIDE_COVER_TEXT.periodTop,
            fontSize: DIARY_BOOK_INSIDE_COVER_TEXT.periodFontSize,
          }}
        >
          {periodLabel}
        </p>
      </div>
    </div>
  );
}

export function DiaryBookBackCoverPage() {
  return (
    <div className="relative overflow-hidden bg-white" style={PAGE_STYLE}>
      <Image
        src={diaryBookBackCoverImagePath()}
        alt="あしあとブック・裏表紙"
        fill
        className="object-cover"
        sizes="540px"
      />
    </div>
  );
}

/** ① 中表紙の裏（専用調整イラスト・724×1024） */
export function DiaryBookInsideCoverBackIllustrationPage() {
  return (
    <div className="relative overflow-hidden bg-[#fdfaf4]" style={PAGE_STYLE}>
      <Image
        src={diaryBookInsideCoverBackIllustrationImagePath()}
        alt="あしあとブック・中表紙裏"
        fill
        className="object-cover"
        sizes="540px"
      />
    </div>
  );
}

/** 日記本文枚数の見開き調整（全月共通・③） */
export function DiaryBookMonthBodyOddAdjustmentPage({
  year,
  monthIndex,
}: {
  year: number;
  monthIndex: number;
}) {
  const month = monthIndex + 1;
  return (
    <div className="relative overflow-hidden bg-[#fdfaf4]" style={PAGE_STYLE}>
      <Image
        src={diaryBookMonthBodyOddAdjustmentIllustrationImagePath()}
        alt={`${year}年${month}月・本文調整`}
        fill
        className="object-cover"
        sizes="540px"
      />
      <span className="sr-only">
        {year}年{month}月・調整ページ
      </span>
    </div>
  );
}

/** 今日のすうじ 早見表（自由記入の直前・724×1024） */
export function DiaryBookNumerologyQuickReferencePage() {
  return (
    <div className="relative overflow-hidden bg-[#fdfaf4]" style={PAGE_STYLE}>
      <Image
        src={diaryBookNumerologyQuickReferenceImagePath()}
        alt="あしあとブック・今日のすうじ 早見表"
        fill
        className="object-cover"
        sizes="540px"
      />
    </div>
  );
}

/** 自由記入欄（見開き） */
export function DiaryBookFreeWritingPage({ spreadSide }: { spreadSide: "left" | "right" }) {
  const src =
    spreadSide === "left"
      ? diaryBookFreeWritingLeftImagePath()
      : diaryBookFreeWritingRightImagePath();
  return (
    <div className="relative overflow-hidden bg-[#fdfaf4]" style={PAGE_STYLE}>
      <Image
        src={src}
        alt={spreadSide === "left" ? "あしあとブック・自由記入（左）" : "あしあとブック・自由記入（右）"}
        fill
        className="object-cover"
        sizes="540px"
      />
    </div>
  );
}

/** 裏表紙直前（全員必須） */
export function DiaryBookPreBackCoverIllustrationPage() {
  return (
    <div className="relative overflow-hidden bg-[#fdfaf4]" style={PAGE_STYLE}>
      <Image
        src={diaryBookPreBackCoverIllustrationImagePath()}
        alt="あしあとブック・裏表紙前"
        fill
        className="object-cover"
        sizes="540px"
      />
    </div>
  );
}

/** 月索引の裏（全月共通・足跡イラスト・724×1024） */
export function DiaryBookMonthIllustrationPage({
  year,
  monthIndex,
}: {
  year: number;
  monthIndex: number;
}) {
  const month = monthIndex + 1;
  return (
    <div className="relative overflow-hidden bg-[#fdfaf4]" style={PAGE_STYLE}>
      <Image
        src={diaryBookMonthIllustrationImagePath()}
        alt={`${year}年${month}月・足跡`}
        fill
        className="object-cover"
        sizes="540px"
      />
      <span className="sr-only">
        {year}年{month}月のイラスト（足跡）
      </span>
    </div>
  );
}

/** 月カレンダー索引（724×1024・外枠なし） */
export function DiaryBookMonthPage({
  year,
  monthIndex,
  entries,
}: {
  year: number;
  monthIndex: number;
  entries: BoundDiaryEntry[];
}) {
  return (
    <DiaryBoundMonthCalendarPage
      year={year}
      monthIndex={monthIndex}
      entries={entries}
      bookReader
    />
  );
}
