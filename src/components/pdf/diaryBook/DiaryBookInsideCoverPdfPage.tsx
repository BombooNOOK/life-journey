import React from "react";
import { StyleSheet, Text } from "@react-pdf/renderer";

import { DiaryBookPdfPageCanvas } from "@/components/pdf/diaryBook/DiaryBookPdfPageCanvas";
import { DIARY_BOOK_INSIDE_COVER_TEXT } from "@/lib/journal/diaryBookInsideCoverLayout";
import { diaryBookPdfPct } from "@/lib/journal/diaryBookPrintPdfLayout";

const styles = StyleSheet.create({
  title: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: "NotoSansJP",
    fontWeight: 700,
    color: "#44403c",
    fontSize: 22,
    lineHeight: 1.35,
    paddingHorizontal: diaryBookPdfPct("10%", "x"),
  },
  period: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: "NotoSansJP",
    fontWeight: 400,
    color: "#57534e",
    fontSize: 14,
    lineHeight: 1.4,
    paddingHorizontal: diaryBookPdfPct("10%", "x"),
  },
});

function formatPeriodLabel(startDate: string, endDate: string): string {
  return `${startDate.replace(/-/g, "/")} 〜 ${endDate.replace(/-/g, "/")}`;
}

export function DiaryBookInsideCoverPdfPage({
  backgroundSrc,
  title,
  startDate,
  endDate,
}: {
  backgroundSrc: string;
  title: string;
  startDate: string;
  endDate: string;
}) {
  const titleTop = diaryBookPdfPct(DIARY_BOOK_INSIDE_COVER_TEXT.titleTop, "y");
  const periodTop = diaryBookPdfPct(DIARY_BOOK_INSIDE_COVER_TEXT.periodTop, "y");

  return (
    <DiaryBookPdfPageCanvas backgroundSrc={backgroundSrc}>
      <Text style={[styles.title, { top: titleTop }]}>{title}</Text>
      <Text style={[styles.period, { top: periodTop }]}>
        {formatPeriodLabel(startDate, endDate)}
      </Text>
    </DiaryBookPdfPageCanvas>
  );
}
