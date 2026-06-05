import React from "react";
import { Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { DIARY_BOOK_INSIDE_COVER_TEXT } from "@/lib/journal/diaryBookInsideCoverLayout";
import {
  diaryBookPdfPct,
  DIARY_BOOK_PDF_PAGE_WIDTH_PT,
} from "@/lib/journal/diaryBookPrintPdfLayout";

const styles = StyleSheet.create({
  page: {
    padding: 0,
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
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
    <Page size="A5" orientation="portrait" style={styles.page}>
      <Image cache={false} src={backgroundSrc} style={styles.image} />
      <View style={{ position: "absolute", width: DIARY_BOOK_PDF_PAGE_WIDTH_PT, height: "100%" }}>
        <Text style={[styles.title, { top: titleTop }]}>{title}</Text>
        <Text style={[styles.period, { top: periodTop }]}>
          {formatPeriodLabel(startDate, endDate)}
        </Text>
      </View>
    </Page>
  );
}
