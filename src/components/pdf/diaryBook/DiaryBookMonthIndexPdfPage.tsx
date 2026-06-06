import React from "react";
import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";

import { DiaryBookPdfPageCanvas } from "@/components/pdf/diaryBook/DiaryBookPdfPageCanvas";
import type { BoundDiaryEntry } from "@/components/journal/DiaryYearBoundPages";
import {
  buildDiaryBookMonthIndexViewModel,
  DIARY_BOOK_READER_CALENDAR_CELL_GAP_PX,
  DIARY_BOOK_READER_CALENDAR_GRID_MIN_HEIGHT_PX,
  DIARY_BOOK_READER_CALENDAR_SUMMARY_GAP_PX,
  DIARY_BOOK_READER_HORIZONTAL_PADDING_PX,
  DIARY_BOOK_READER_INDEX_HEADER_HEIGHT_PX,
  DIARY_BOOK_READER_INDEX_TITLE_PADDING_TOP_PX,
  DIARY_BOOK_READER_PAGE_BG,
  DIARY_BOOK_READER_SUMMARY_BG,
  DIARY_BOOK_READER_SUMMARY_BORDER,
  DIARY_BOOK_READER_TITLE_TO_CALENDAR_GAP_PX,
  DIARY_BOOK_READER_WEEKDAY_CALENDAR_GAP_PX,
  DIARY_BOOK_READER_WEEKDAY_LABELS,
  diaryBookMonthIndexCellHeightPx,
  diaryBookMonthIndexCellWidthPx,
} from "@/lib/journal/diaryBookMonthIndexData";
import {
  DIARY_BOOK_DESIGN_HEIGHT_PX,
  DIARY_BOOK_DESIGN_WIDTH_PX,
  diaryBookPdfPx,
} from "@/lib/journal/diaryBookPrintPdfLayout";

/** 724px 設計上の肉球マーク幅（ビューワー CALENDAR_PAWPRINT_SIZE_PX=18 に合わせる） */
const PAWPRINT_ICON_WIDTH_PX = 18;
/** ビューワー opacity-85 相当 */
const PAWPRINT_OPACITY = 0.85;

const styles = StyleSheet.create({
  titleYear: {
    fontFamily: "NotoSansJP",
    fontSize: 18,
    color: "#44403c",
    letterSpacing: 0.6,
  },
  titleYearSuffix: {
    fontFamily: "NotoSansJP",
    fontSize: 14,
    color: "#57534e",
    marginLeft: 6,
    letterSpacing: 2.8,
  },
  titleMonth: {
    fontFamily: "NotoSansJP",
    fontSize: 34,
    fontWeight: 700,
    color: "#44403c",
    letterSpacing: 0.4,
  },
  titleMonthSuffix: {
    fontFamily: "NotoSansJP",
    fontSize: 24,
    fontWeight: 500,
    color: "#44403c",
    marginLeft: 8,
    letterSpacing: 3.2,
  },
  weekdayCell: {
    flex: 1,
    textAlign: "center",
    fontFamily: "NotoSansJP",
    fontSize: 9,
    color: "#78716c",
    paddingVertical: 2,
  },
  dayNumber: {
    fontFamily: "NotoSansJP",
    fontSize: 11,
    fontWeight: 500,
    color: "#44403c",
    textAlign: "center",
  },
  pawprintSlot: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  dayExtra: {
    fontFamily: "NotoSansJP",
    fontSize: 8,
    fontWeight: 500,
    textAlign: "center",
    color: "#166534",
    paddingBottom: 3,
  },
  summaryLine: {
    fontFamily: "NotoSansJP",
    fontSize: 10,
    color: "#5a5348",
    lineHeight: 1.5,
  },
  summaryStrong: {
    fontFamily: "NotoSansJP",
    fontWeight: 700,
    color: "#3f4538",
  },
  summaryPhrase: {
    fontFamily: "NotoSansJP",
    fontSize: 10,
    color: "#5c554c",
    lineHeight: 1.5,
    marginTop: 6,
  },
  cellBackground: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "#f5f5f4",
    borderRadius: 3,
  },
  cellBackgroundToday: {
    borderColor: "#fcd34d",
    borderWidth: 1.5,
  },
});

function scaled(px: number, axis: "x" | "y" = "y"): number {
  return diaryBookPdfPx(px, axis);
}

export function DiaryBookMonthIndexPdfPage({
  moonSrc,
  pawprintSrc,
  year,
  monthIndex,
  entries,
}: {
  moonSrc: string;
  pawprintSrc: string;
  year: number;
  monthIndex: number;
  entries: BoundDiaryEntry[];
}) {
  const vm = buildDiaryBookMonthIndexViewModel(year, monthIndex, entries);

  const contentLeft = scaled(DIARY_BOOK_READER_HORIZONTAL_PADDING_PX, "x");
  const contentWidth =
    scaled(DIARY_BOOK_DESIGN_WIDTH_PX, "x") -
    scaled(DIARY_BOOK_READER_HORIZONTAL_PADDING_PX, "x") * 2;
  const cellWidth = scaled(diaryBookMonthIndexCellWidthPx(), "x");
  const cellHeight = scaled(diaryBookMonthIndexCellHeightPx(), "y");
  const cellGapX = scaled(DIARY_BOOK_READER_CALENDAR_CELL_GAP_PX, "x");
  const cellGapY = scaled(DIARY_BOOK_READER_CALENDAR_CELL_GAP_PX, "y");

  const pawprintWidth = scaled(PAWPRINT_ICON_WIDTH_PX, "x");
  const pawprintHeight = pawprintWidth;
  const dayRowHeight = scaled(16, "y");
  const extraRowHeight = scaled(12, "y");
  const pawRowHeight = cellHeight - dayRowHeight - extraRowHeight;

  const headerHeight = scaled(DIARY_BOOK_READER_INDEX_HEADER_HEIGHT_PX, "y");
  const titlePaddingTop = scaled(DIARY_BOOK_READER_INDEX_TITLE_PADDING_TOP_PX, "y");
  const titleToCalendarGap = scaled(DIARY_BOOK_READER_TITLE_TO_CALENDAR_GAP_PX, "y");
  const weekdayCalendarGap = scaled(DIARY_BOOK_READER_WEEKDAY_CALENDAR_GAP_PX, "y");
  const calendarTop =
    headerHeight + titleToCalendarGap + scaled(18, "y") + weekdayCalendarGap;
  const calendarHeight = scaled(DIARY_BOOK_READER_CALENDAR_GRID_MIN_HEIGHT_PX, "y");
  const summaryTop = calendarTop + calendarHeight + scaled(DIARY_BOOK_READER_CALENDAR_SUMMARY_GAP_PX, "y");

  const pageWidth = scaled(DIARY_BOOK_DESIGN_WIDTH_PX, "x");
  const pageHeight = scaled(DIARY_BOOK_DESIGN_HEIGHT_PX, "y");

  return (
    <DiaryBookPdfPageCanvas>
      {/* 下層: 生成り地（ビューワー bg-[#fdfaf4] 相当） */}
      <View
        wrap={false}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: pageWidth,
          height: pageHeight,
          backgroundColor: DIARY_BOOK_READER_PAGE_BG,
        }}
      />
      {/* 中層: 月シルエット（724×1024・幅100%・上寄せ） */}
      <Image
        cache={false}
        src={moonSrc}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: pageWidth,
          height: pageHeight,
        }}
      />
      {/* セル背景（白セル・gap で生成りが見える） */}
      <View
        wrap={false}
        style={{
          position: "absolute",
          top: calendarTop,
          left: contentLeft,
          width: contentWidth,
          height: calendarHeight,
        }}
      >
        {vm.cells.map((cell, index) => {
          const row = Math.floor(index / 7);
          const col = index % 7;
          if (cell.day === null) return null;
          return (
            <View
              key={`bg-${index}`}
              wrap={false}
              style={[
                styles.cellBackground,
                ...(cell.isToday ? [styles.cellBackgroundToday] : []),
                {
                  position: "absolute",
                  left: col * (cellWidth + cellGapX),
                  top: row * (cellHeight + cellGapY),
                  width: cellWidth,
                  height: cellHeight,
                },
              ]}
            />
          );
        })}
      </View>

      {/* 年・月タイトル */}
      <View
        wrap={false}
        style={{
          position: "absolute",
          top: titlePaddingTop,
          left: 0,
          width: "100%",
          height: headerHeight - titlePaddingTop,
          alignItems: "center",
        }}
      >
        <View wrap={false} style={{ flexDirection: "row", alignItems: "baseline" }}>
          <Text style={styles.titleYear}>{vm.year}</Text>
          <Text style={styles.titleYearSuffix}>年</Text>
        </View>
        <View
          wrap={false}
          style={{ flexDirection: "row", alignItems: "baseline", marginTop: scaled(8, "y") }}
        >
          <Text style={styles.titleMonth}>{vm.month}</Text>
          <Text style={styles.titleMonthSuffix}>月</Text>
        </View>
      </View>

      {/* 曜日行 */}
      <View
        wrap={false}
        style={{
          position: "absolute",
          top: headerHeight + titleToCalendarGap,
          left: contentLeft,
          width: contentWidth,
          flexDirection: "row",
        }}
      >
        {DIARY_BOOK_READER_WEEKDAY_LABELS.map((label) => (
          <Text key={label} style={styles.weekdayCell}>
            {label}
          </Text>
        ))}
      </View>

      {/* 日付・肉球PNG・+N */}
      <View
        wrap={false}
        style={{
          position: "absolute",
          top: calendarTop,
          left: contentLeft,
          width: contentWidth,
          height: calendarHeight,
        }}
      >
        {vm.cells.map((cell, index) => {
          if (cell.day === null) return null;
          const row = Math.floor(index / 7);
          const col = index % 7;
          const showPawprint = cell.hasEntry;

          return (
            <View
              key={`day-${index}`}
              wrap={false}
              style={{
                position: "absolute",
                left: col * (cellWidth + cellGapX),
                top: row * (cellHeight + cellGapY),
                width: cellWidth,
                height: cellHeight,
                alignItems: "center",
              }}
            >
              <View
                wrap={false}
                style={{
                  height: dayRowHeight,
                  width: cellWidth,
                  justifyContent: "center",
                  paddingTop: scaled(6, "y"),
                }}
              >
                <Text style={styles.dayNumber}>{cell.day}</Text>
              </View>
              <View
                wrap={false}
                style={[
                  styles.pawprintSlot,
                  {
                    width: cellWidth,
                    height: pawRowHeight,
                    paddingBottom: scaled(2, "y"),
                  },
                ]}
              >
                {showPawprint ? (
                  <Image
                    cache={false}
                    src={pawprintSrc}
                    style={{
                      width: pawprintWidth,
                      height: pawprintHeight,
                      opacity: PAWPRINT_OPACITY,
                    }}
                  />
                ) : null}
              </View>
              <View
                wrap={false}
                style={{
                  height: extraRowHeight,
                  width: cellWidth,
                  justifyContent: "center",
                  paddingBottom: scaled(4, "y"),
                }}
              >
                <Text style={styles.dayExtra}>
                  {cell.extraEntryCount > 0 ? `+${cell.extraEntryCount}` : " "}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* 月まとめ（気分はラベルのみ。絵文字は PDF フォントで文字化けするため省略） */}
      <View
        wrap={false}
        style={{
          position: "absolute",
          top: summaryTop,
          left: contentLeft,
          width: contentWidth,
          borderWidth: 1,
          borderColor: DIARY_BOOK_READER_SUMMARY_BORDER,
          backgroundColor: DIARY_BOOK_READER_SUMMARY_BG,
          borderRadius: scaled(6, "x"),
          paddingVertical: scaled(10, "y"),
          paddingHorizontal: scaled(12, "x"),
        }}
      >
        <Text style={styles.summaryLine}>
          記録した日:{" "}
          <Text style={styles.summaryStrong}>{vm.daysWithEntryCount}</Text> 日
          {vm.hasMultipleEntriesSameDay ? (
            <Text style={{ color: "#6b6358" }}>（同日に複数件あり）</Text>
          ) : null}
        </Text>
        <Text style={[styles.summaryLine, { marginTop: scaled(6, "y") }]}>
          よく出た気分: <Text style={styles.summaryStrong}>{vm.topMoodLabel}</Text>
        </Text>
        <Text style={styles.summaryPhrase}>{vm.monthPhrase}</Text>
      </View>
    </DiaryBookPdfPageCanvas>
  );
}
