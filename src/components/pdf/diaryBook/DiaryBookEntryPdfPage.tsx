import React from "react";
import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";

import { DiaryBookPdfPageCanvas } from "@/components/pdf/diaryBook/DiaryBookPdfPageCanvas";
import type { BoundDiaryEntry } from "@/components/journal/DiaryYearBoundPages";
import { normalizeContentFontMode } from "@/lib/journal/contentFontMode";
import { getBodyLayoutLinesForBindingPreview } from "@/lib/journal/diaryPreviewBodyLineLimits";
import {
  DIARY_PREVIEW_ACTIVITY_ANSWER_NUDGE_Y_PX,
  DIARY_PREVIEW_ACTIVITY_ANSWER_SLOT_HEIGHT_PX,
  DIARY_PREVIEW_ACTIVITY_ANSWER_SLOT_TOP_PX,
  DIARY_PREVIEW_BODY_REGION,
  DIARY_PREVIEW_COMMENT_REGION,
  DIARY_PREVIEW_COMMENT_TEXT_STYLE,
  DIARY_PREVIEW_DATE_ROW_STYLE,
  DIARY_PREVIEW_MOOD_EMOJI,
  DIARY_PREVIEW_NUMBER_STYLE,
  DIARY_PREVIEW_TEMPLATE_LAYOUT,
  getDiaryPreviewBodySafeScrollHeightPx,
  getFixedPreviewActivityTextStyle,
  getFixedPreviewBodyTextStyle,
  regionBoxToPx,
} from "@/lib/journal/diaryPreviewFixedLayout";
import { resolveDiaryBookPublicImagePath } from "@/lib/journal/diaryBookPrintPdfAssets";
import { moodOwlIconImagePath } from "@/lib/journal/moodAssets";
import { getActivityMeta } from "@/lib/journal/meta";
import {
  diaryBookPdfPct,
  diaryBookPdfPx,
  parseCssPx,
} from "@/lib/journal/diaryBookPrintPdfLayout";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

const styles = StyleSheet.create({
  dateText: {
    position: "absolute",
    fontFamily: "NotoSansJP",
    color: "#44403c",
    lineHeight: 1,
  },
  activityBox: {
    position: "absolute",
    fontFamily: "NotoSansJP",
    color: "#44403c",
    overflow: "hidden",
  },
  activityText: {
    fontFamily: "NotoSansJP",
    color: "#44403c",
    width: "100%",
  },
  bodyBox: {
    position: "absolute",
    overflow: "hidden",
    fontFamily: "NotoSansJP",
    color: "rgba(68, 64, 60, 0.9)",
  },
  bodyLine: {
    fontFamily: "NotoSansJP",
    color: "rgba(68, 64, 60, 0.9)",
    width: "100%",
  },
  commentBox: {
    position: "absolute",
    overflow: "hidden",
    fontFamily: "NotoSansJP",
    color: "rgba(68, 64, 60, 0.85)",
  },
  commentText: {
    fontFamily: "NotoSansJP",
    color: "rgba(68, 64, 60, 0.85)",
    width: "100%",
  },
  numberSlot: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "NotoSansJP",
    fontWeight: 700,
    color: "#44403c",
    textAlign: "center",
  },
  moodSlot: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  moodIconImage: {
    objectFit: "contain",
  },
  photoFrame: {
    position: "absolute",
    overflow: "hidden",
    backgroundColor: "rgba(248, 244, 234, 0.8)",
  },
  photoImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
});

function parsePadding(padding: string): { top: number; right: number; bottom: number; left: number } {
  const parts = padding.split(/\s+/).map((v) => parseCssPx(v));
  if (parts.length === 1) {
    const p = diaryBookPdfPx(parts[0]!, "y");
    return { top: p, right: p, bottom: p, left: p };
  }
  if (parts.length === 2) {
    return {
      top: diaryBookPdfPx(parts[0]!, "y"),
      right: diaryBookPdfPx(parts[1]!, "x"),
      bottom: diaryBookPdfPx(parts[0]!, "y"),
      left: diaryBookPdfPx(parts[1]!, "x"),
    };
  }
  if (parts.length === 4) {
    return {
      top: diaryBookPdfPx(parts[0]!, "y"),
      right: diaryBookPdfPx(parts[1]!, "x"),
      bottom: diaryBookPdfPx(parts[2]!, "y"),
      left: diaryBookPdfPx(parts[3]!, "x"),
    };
  }
  return { top: 0, right: 0, bottom: 0, left: 0 };
}

export function DiaryBookEntryPdfPage({
  templateSrc,
  entry,
  photoDataUri,
}: {
  templateSrc: string;
  entry: BoundDiaryEntry;
  photoDataUri?: string | null;
}) {
  const layout = DIARY_PREVIEW_TEMPLATE_LAYOUT;
  const previewDate = new Date(entry.createdAt);
  const weekdayLabel = WEEKDAY_LABELS[previewDate.getDay()] ?? "";
  const moodIconSrc = resolveDiaryBookPublicImagePath(moodOwlIconImagePath(entry.mood));
  const activityLabel = getActivityMeta(entry.activity).label;
  const trimmedActivity =
    activityLabel.length > 62 ? `${activityLabel.slice(0, 62)}…` : activityLabel;

  const contentFontMode = normalizeContentFontMode(entry.contentFontMode);
  const bodyTextStyle = getFixedPreviewBodyTextStyle(contentFontMode);
  const activityTextStyle = getFixedPreviewActivityTextStyle();
  const bodyLines = entry.content.trim()
    ? getBodyLayoutLinesForBindingPreview(entry.content, contentFontMode)
    : [];

  const bodyRegion = regionBoxToPx(DIARY_PREVIEW_BODY_REGION);
  const commentRegion = regionBoxToPx(DIARY_PREVIEW_COMMENT_REGION);
  const commentPadding = parsePadding("5px 10px 9px 8px");
  const bodyClipHeight = diaryBookPdfPx(getDiaryPreviewBodySafeScrollHeightPx(), "y");
  const bodyWidth = diaryBookPdfPx(bodyRegion.width, "x");

  const owlComment =
    entry.generatedComment?.trim() ||
    "保存後に「フクロウ先生の読み解き」がここに入ります。";

  const numbers = entry.diaryNumbers ?? {
    today: "-",
    month: "-",
    year: "-",
    calmness: "-",
  };

  const dateFontSize = diaryBookPdfPx(parseCssPx(DIARY_PREVIEW_DATE_ROW_STYLE.fontSize), "x");
  const bodyFontSize = diaryBookPdfPx(parseCssPx(bodyTextStyle.fontSize), "x");
  const bodyLineHeight = parseFloat(bodyTextStyle.lineHeight) || 1.575;
  const activityFontSize = diaryBookPdfPx(parseCssPx(activityTextStyle.fontSize), "x");
  const activityWidth = diaryBookPdfPct("64.8%", "x");
  const commentFontSize =
    diaryBookPdfPx(parseCssPx(DIARY_PREVIEW_COMMENT_TEXT_STYLE.fontSize), "x") * 0.97;
  const commentLineHeight = 1.58;
  const commentWidth = diaryBookPdfPx(commentRegion.width, "x");
  const numberFontSize = diaryBookPdfPx(parseCssPx(DIARY_PREVIEW_NUMBER_STYLE.fontSize), "x");

  const numberSlotWidth = diaryBookPdfPx(DIARY_PREVIEW_NUMBER_STYLE.slotWidthPx, "x");
  const numberSlotHeight = diaryBookPdfPx(DIARY_PREVIEW_NUMBER_STYLE.slotHeightPx, "y");
  const moodBoxSize = diaryBookPdfPx(DIARY_PREVIEW_MOOD_EMOJI.boxPx, "x");
  const numberCenterX = diaryBookPdfPct(layout.numberLeft, "x");

  const photoWidth = diaryBookPdfPct(layout.photoWidth, "x");
  const photoLeft = diaryBookPdfPct(layout.photoLeft, "x");
  const photoTop = diaryBookPdfPct(layout.photoTop, "y");

  const hasPhoto = entry.hasPhoto === true && Boolean(photoDataUri?.trim());

  const dateSlots = [
    { left: layout.dateYearLeft, text: String(previewDate.getFullYear()) },
    { left: layout.dateMonthLeft, text: String(previewDate.getMonth() + 1) },
    { left: layout.dateDayLeft, text: String(previewDate.getDate()) },
    { left: layout.dateWeekLeft, text: weekdayLabel },
  ] as const;

  const numberSlots = [
    { top: layout.numberTodayTop, value: String(numbers.today) },
    { top: layout.numberMonthTop, value: String(numbers.month) },
    { top: layout.numberYearTop, value: String(numbers.year) },
  ] as const;

  return (
    <DiaryBookPdfPageCanvas backgroundSrc={templateSrc}>
        {dateSlots.map((slot) => (
          <Text
            key={slot.left}
            wrap={false}
            style={[
              styles.dateText,
              {
                left: diaryBookPdfPct(slot.left, "x"),
                top: diaryBookPdfPct(layout.dateTop, "y"),
                fontSize: dateFontSize,
              },
            ]}
          >
            {slot.text}
          </Text>
        ))}

        <View
          wrap={false}
          style={[
            styles.activityBox,
            {
              left: diaryBookPdfPct(layout.activityLeft, "x"),
              top:
                diaryBookPdfPx(DIARY_PREVIEW_ACTIVITY_ANSWER_SLOT_TOP_PX, "y") +
                diaryBookPdfPx(DIARY_PREVIEW_ACTIVITY_ANSWER_NUDGE_Y_PX, "y"),
              width: activityWidth,
              height: diaryBookPdfPx(DIARY_PREVIEW_ACTIVITY_ANSWER_SLOT_HEIGHT_PX, "y"),
              fontSize: activityFontSize,
              lineHeight: 1.25,
              justifyContent: "center",
            },
          ]}
        >
          <Text wrap style={[styles.activityText, { fontSize: activityFontSize, lineHeight: 1.25 }]}>
            {trimmedActivity}
          </Text>
        </View>

        <View
          wrap={false}
          style={[
            styles.bodyBox,
            {
              left: diaryBookPdfPx(bodyRegion.left, "x"),
              top: diaryBookPdfPx(bodyRegion.top, "y"),
              width: bodyWidth,
              height: bodyClipHeight,
              fontSize: bodyFontSize,
              lineHeight: bodyLineHeight,
            },
          ]}
        >
          {bodyLines.map((line, index) => (
            <Text
              key={index}
              wrap={false}
              style={[styles.bodyLine, { fontSize: bodyFontSize, lineHeight: bodyLineHeight, width: bodyWidth }]}
            >
              {line.length > 0 ? line : " "}
            </Text>
          ))}
        </View>

        <View
          wrap={false}
          style={[
            styles.commentBox,
            {
              left: diaryBookPdfPx(commentRegion.left, "x"),
              top: diaryBookPdfPx(commentRegion.top, "y"),
              width: commentWidth,
              height: diaryBookPdfPx(commentRegion.height, "y"),
              paddingTop: commentPadding.top,
              paddingRight: commentPadding.right,
              paddingBottom: commentPadding.bottom,
              paddingLeft: commentPadding.left,
              fontSize: commentFontSize,
              lineHeight: commentLineHeight,
            },
          ]}
        >
          <Text
            wrap
            style={[
              styles.commentText,
              {
                fontSize: commentFontSize,
                lineHeight: commentLineHeight,
                width: commentWidth - commentPadding.left - commentPadding.right,
              },
            ]}
          >
            {owlComment}
          </Text>
        </View>

        {numberSlots.map((slot) => (
          <View
            key={slot.top}
            wrap={false}
            style={[
              styles.numberSlot,
              {
                left: numberCenterX - numberSlotWidth / 2,
                top: diaryBookPdfPct(slot.top, "y") - numberSlotHeight / 2,
                width: numberSlotWidth,
                height: numberSlotHeight,
                fontSize: numberFontSize,
              },
            ]}
          >
            <Text wrap={false}>{slot.value}</Text>
          </View>
        ))}

        <View
          wrap={false}
          style={[
            styles.moodSlot,
            {
              left: numberCenterX - moodBoxSize / 2,
              top: diaryBookPdfPct(layout.numberCalmTop, "y") - moodBoxSize * 0.44,
              width: moodBoxSize,
              height: moodBoxSize,
            },
          ]}
        >
          <Image
            cache={false}
            src={moodIconSrc}
            style={[styles.moodIconImage, { width: moodBoxSize, height: moodBoxSize }]}
          />
        </View>

        <View
          wrap={false}
          style={[
            styles.photoFrame,
            {
              left: photoLeft,
              top: photoTop,
              width: photoWidth,
              height: photoWidth,
            },
          ]}
        >
          {hasPhoto ? (
            <Image cache={false} src={photoDataUri!} style={styles.photoImage} />
          ) : null}
        </View>
    </DiaryBookPdfPageCanvas>
  );
}
