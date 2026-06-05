import React from "react";
import { StyleSheet, Text, View } from "@react-pdf/renderer";

import { DiaryBookPdfPageCanvas } from "@/components/pdf/diaryBook/DiaryBookPdfPageCanvas";
import type { BoundDiaryEntry } from "@/components/journal/DiaryYearBoundPages";
import { diaryBookEntriesInMonth } from "@/lib/journal/diaryBookPages";
import { getMoodMeta } from "@/lib/journal/meta";
import {
  diaryBookPdfPct,
  DIARY_BOOK_PDF_PAGE_WIDTH_PT,
} from "@/lib/journal/diaryBookPrintPdfLayout";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;
const CALENDAR_ROWS = 6;

const styles = StyleSheet.create({
  content: {
    position: "absolute",
    alignItems: "center",
  },
  titleYear: {
    fontFamily: "NotoSansJP",
    fontSize: 18,
    color: "#44403c",
    letterSpacing: 1,
  },
  titleYearSuffix: {
    fontFamily: "NotoSansJP",
    fontSize: 14,
    color: "#57534e",
    marginLeft: 6,
  },
  titleMonth: {
    fontFamily: "NotoSansJP",
    fontSize: 34,
    fontWeight: 700,
    color: "#44403c",
    marginTop: 6,
  },
  titleMonthSuffix: {
    fontFamily: "NotoSansJP",
    fontSize: 24,
    color: "#44403c",
    marginLeft: 8,
  },
  weekdayRow: {
    flexDirection: "row",
    marginTop: 8,
    marginBottom: 4,
    width: "100%",
  },
  weekdayCell: {
    flex: 1,
    textAlign: "center",
    fontFamily: "NotoSansJP",
    fontSize: 9,
    color: "#78716c",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontFamily: "NotoSansJP",
    fontSize: 10,
    color: "#57534e",
  },
  dayTextWithEntry: {
    fontFamily: "NotoSansJP",
    fontSize: 10,
    fontWeight: 700,
    color: "#365314",
  },
  summaryBox: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#c9d2bc",
    backgroundColor: "#f2f0e8",
    borderRadius: 4,
    width: "100%",
  },
  summaryText: {
    fontFamily: "NotoSansJP",
    fontSize: 9,
    color: "#44403c",
    lineHeight: 1.45,
    textAlign: "center",
  },
});

type CalendarCell = { day: number | null; hasEntry: boolean };

function buildCalendarCells(year: number, monthIndex: number, entries: BoundDiaryEntry[]): CalendarCell[] {
  const entryDays = new Set(
    entries.map((e) => new Date(e.createdAt).getDate()),
  );
  const firstDay = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let i = 0; i < firstDay.getDay(); i += 1) {
    cells.push({ day: null, hasEntry: false });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, hasEntry: entryDays.has(day) });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: null, hasEntry: false });
  }
  while (cells.length < CALENDAR_ROWS * 7) {
    cells.push({ day: null, hasEntry: false });
  }
  return cells;
}

function dominantMoodLabel(entries: BoundDiaryEntry[]): string | null {
  if (entries.length === 0) return null;
  const counts = new Map<string, number>();
  for (const entry of entries) {
    counts.set(entry.mood, (counts.get(entry.mood) ?? 0) + 1);
  }
  let topMood = entries[0]!.mood;
  let topCount = 0;
  for (const [mood, count] of counts) {
    if (count > topCount) {
      topMood = mood;
      topCount = count;
    }
  }
  return getMoodMeta(topMood).label;
}

export function DiaryBookMonthIndexPdfPage({
  backgroundSrc,
  year,
  monthIndex,
  entries,
}: {
  backgroundSrc: string;
  year: number;
  monthIndex: number;
  entries: BoundDiaryEntry[];
}) {
  const month = monthIndex + 1;
  const monthEntries = diaryBookEntriesInMonth(entries, year, monthIndex);
  const cells = buildCalendarCells(year, monthIndex, monthEntries);
  const moodLabel = dominantMoodLabel(monthEntries);

  const contentTop = diaryBookPdfPct("42%", "y");
  const contentWidth = diaryBookPdfPct("72%", "x");
  const contentLeft = (DIARY_BOOK_PDF_PAGE_WIDTH_PT - contentWidth) / 2;

  return (
    <DiaryBookPdfPageCanvas backgroundSrc={backgroundSrc}>
      <View
        wrap={false}
        style={[
          styles.content,
          {
            top: contentTop,
            left: contentLeft,
            width: contentWidth,
          },
        ]}
      >
        <View wrap={false} style={{ alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "baseline" }}>
            <Text style={styles.titleYear}>{year}</Text>
            <Text style={styles.titleYearSuffix}>年</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 4 }}>
            <Text style={styles.titleMonth}>{month}</Text>
            <Text style={styles.titleMonthSuffix}>月</Text>
          </View>
        </View>

        <View wrap={false} style={styles.weekdayRow}>
          {WEEKDAY_LABELS.map((label) => (
            <Text key={label} style={styles.weekdayCell}>
              {label}
            </Text>
          ))}
        </View>

        <View wrap={false} style={styles.calendarGrid}>
          {cells.map((cell, index) => (
            <View key={index} style={styles.dayCell} wrap={false}>
              {cell.day != null ? (
                <Text style={cell.hasEntry ? styles.dayTextWithEntry : styles.dayText}>
                  {cell.day}
                </Text>
              ) : null}
            </View>
          ))}
        </View>

        <View wrap={false} style={styles.summaryBox}>
          <Text style={styles.summaryText}>
            記録 {monthEntries.length} 件
            {moodLabel ? ` · よくあった気分: ${moodLabel}` : ""}
          </Text>
        </View>
      </View>
    </DiaryBookPdfPageCanvas>
  );
}
