import React from "react";
import { Document } from "@react-pdf/renderer";

import { DiaryBookEntryPdfPage } from "@/components/pdf/diaryBook/DiaryBookEntryPdfPage";
import { DiaryBookFullBleedPdfPage } from "@/components/pdf/diaryBook/DiaryBookFullBleedPdfPage";
import { DiaryBookInsideCoverPdfPage } from "@/components/pdf/diaryBook/DiaryBookInsideCoverPdfPage";
import { DiaryBookMonthIndexPdfPage } from "@/components/pdf/diaryBook/DiaryBookMonthIndexPdfPage";
import {
  diaryBookBackCoverImagePath,
  diaryBookBodyTemplatePathForCompanion,
  diaryBookFreeWritingLeftImagePath,
  diaryBookFreeWritingRightImagePath,
  diaryBookInsideCoverBackIllustrationImagePath,
  diaryBookInsideCoverImagePath,
  diaryBookMonthBodyOddAdjustmentIllustrationImagePath,
  diaryBookMonthIllustrationImagePath,
  diaryBookCalendarFootprintImagePath,
  diaryBookMonthIndexImagePath,
  diaryBookPreBackCoverIllustrationImagePath,
} from "@/lib/journal/diaryBookAssets";
import { resolveDiaryBookPublicImagePath } from "@/lib/journal/diaryBookPrintPdfAssets";
import type { DiaryBookPrintPdfPayload } from "@/lib/journal/diaryBookPrintPdfData";
import { diaryCoverImagePath } from "@/lib/journal/coverAssets";

function resolveImage(webPath: string): string {
  return resolveDiaryBookPublicImagePath(webPath);
}

export function DiaryBookPrintDocument({
  bookTitle,
  startDate,
  endDate,
  coverTheme,
  pages,
  entries,
  photoDataUriByEntryId,
}: DiaryBookPrintPdfPayload) {
  return (
    <Document>
      {pages.map((page, index) => {
        switch (page.kind) {
          case "cover":
            return (
              <DiaryBookFullBleedPdfPage
                key={`cover-${index}`}
                imageSrc={resolveImage(diaryCoverImagePath(coverTheme, "owl"))}
              />
            );
          case "inside-cover":
            return (
              <DiaryBookInsideCoverPdfPage
                key={`inside-cover-${index}`}
                backgroundSrc={resolveImage(diaryBookInsideCoverImagePath())}
                title={bookTitle}
                startDate={startDate}
                endDate={endDate}
              />
            );
          case "inside-cover-back-illustration":
            return (
              <DiaryBookFullBleedPdfPage
                key={`inside-cover-back-${index}`}
                imageSrc={resolveImage(diaryBookInsideCoverBackIllustrationImagePath())}
              />
            );
          case "month-index":
            return (
              <DiaryBookMonthIndexPdfPage
                key={`month-index-${page.calendarYear}-${page.monthIndex}-${index}`}
                backgroundSrc={resolveImage(diaryBookMonthIndexImagePath())}
                footprintSrc={resolveImage(diaryBookCalendarFootprintImagePath())}
                year={page.calendarYear}
                monthIndex={page.monthIndex}
                entries={entries}
              />
            );
          case "month-illustration":
            return (
              <DiaryBookFullBleedPdfPage
                key={`month-illustration-${page.calendarYear}-${page.monthIndex}-${index}`}
                imageSrc={resolveImage(diaryBookMonthIllustrationImagePath())}
              />
            );
          case "month-body-odd-adjustment":
            return (
              <DiaryBookFullBleedPdfPage
                key={`month-adjust-${page.calendarYear}-${page.monthIndex}-${index}`}
                imageSrc={resolveImage(diaryBookMonthBodyOddAdjustmentIllustrationImagePath())}
              />
            );
          case "entry":
            return (
              <DiaryBookEntryPdfPage
                key={`entry-${page.entry.id}-${index}`}
                templateSrc={resolveImage(
                  diaryBookBodyTemplatePathForCompanion(page.entry.companionType),
                )}
                entry={page.entry}
                photoDataUri={photoDataUriByEntryId[page.entry.id] ?? null}
              />
            );
          case "free-writing":
            return (
              <DiaryBookFullBleedPdfPage
                key={`free-writing-${page.spreadSide}-${index}`}
                imageSrc={resolveImage(
                  page.spreadSide === "left"
                    ? diaryBookFreeWritingLeftImagePath()
                    : diaryBookFreeWritingRightImagePath(),
                )}
              />
            );
          case "pre-back-cover-illustration":
            return (
              <DiaryBookFullBleedPdfPage
                key={`pre-back-${index}`}
                imageSrc={resolveImage(diaryBookPreBackCoverIllustrationImagePath())}
              />
            );
          case "back":
            return (
              <DiaryBookFullBleedPdfPage
                key={`back-${index}`}
                imageSrc={resolveImage(diaryBookBackCoverImagePath())}
              />
            );
          default:
            return null;
        }
      })}
    </Document>
  );
}
