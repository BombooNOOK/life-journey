import React from "react";
import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";

import { DiaryBookPdfPageCanvas } from "@/components/pdf/diaryBook/DiaryBookPdfPageCanvas";
import type { BoundDiaryEntry } from "@/components/journal/DiaryYearBoundPages";
import {
  ashiatoDailyNumberLabels,
  ashiatoDailyNumberSlotAlign,
  ashiatoDailyNumberSlotLeftNudgePct,
  ashiatoDailyNumberValues,
  ashiatoPercentRectToPx,
  ashiatoPlanShows,
  ashiatoVerticalDateFontSizePx,
  formatAshiatoSlashYmdWeekdayDate,
  formatAshiatoVerticalDateColumns,
  ashiatoHorizontalBodyLineIndentChars,
  getAshiatoHorizontalBodyLayoutLines,
  getAshiatoVerticalBodyColumns,
  ashiatoVerticalDisplayChar,
  resolveAshiatoEnikkiVerticalMetrics,
  resolveAshiatoEntryRenderPlan,
  splitDailyNumberSlots,
} from "@/lib/journal/ashiatoEntryRender";
import { DIARY_BOOK_ENTRY_V2_COLORS } from "@/lib/journal/diaryBookEntryPrintLayout";
import { resolveDiaryBookPublicImagePath } from "@/lib/journal/diaryBookPrintPdfAssets";
import { diaryBookPdfFullBleedImageStyle, diaryBookPdfPct } from "@/lib/journal/diaryBookPrintPdfLayout";
import { getDiaryBookEntryV2BodyFontLayout } from "@/lib/journal/diaryBookEntryBodyFontLayout";
import { resolveDiaryBookEntryV2CommentRenderLayout } from "@/lib/journal/diaryBookEntryCommentWrap";
import { DIARY_BOOK_ENTRY_V2_LABEL_FONT_FAMILY_PDF } from "@/lib/journal/diaryBookEntryLabelFont";
import { normalizeContentFontMode } from "@/lib/journal/contentFontMode";
import { getDiaryPreviewDateRowSegments } from "@/lib/journal/diaryPreviewFixedLayout";
import { getActivityMeta, getCompanionReadingHeading, normalizeCompanionType } from "@/lib/journal/meta";
import { moodOwlIconImagePath } from "@/lib/journal/moodAssets";
import type { AshiatoLayoutPercentRect } from "@/lib/journal/ashiatoPageTemplateLayout";
import { splitFixedWidthJapaneseLines } from "@/lib/pdf/splitFixedWidthJapaneseLines";

const styles = StyleSheet.create({
  photoClip: {
    position: "absolute",
    overflow: "hidden",
  },
  photoImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  centered: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
});

function resolveImage(webPath: string): string {
  return resolveDiaryBookPublicImagePath(webPath);
}

function pctStyle(rect: AshiatoLayoutPercentRect) {
  return {
    position: "absolute" as const,
    left: diaryBookPdfPct(`${rect.left}%`, "x"),
    top: diaryBookPdfPct(`${rect.top}%`, "y"),
    width: diaryBookPdfPct(`${rect.width}%`, "x"),
    height: diaryBookPdfPct(`${rect.height}%`, "y"),
  };
}

export function DiaryBookAshiatoEntryPdfPage({
  entry,
  photoDataUri,
  pageTemplate,
}: {
  entry: BoundDiaryEntry;
  photoDataUri?: string | null;
  pageTemplate?: string | null;
}) {
  const plan = resolveAshiatoEntryRenderPlan({
    pageTemplate,
    companionType: entry.companionType,
  });
  const contentFontMode = normalizeContentFontMode(entry.contentFontMode);
  const bodyFont = getDiaryBookEntryV2BodyFontLayout(contentFontMode);
  const dateVertical = plan.dateLayout === "vertical";
  const dateSlashYmd = plan.dateLayout === "slash_ymd_weekday";
  const showNumberLabels = plan.templateId === "suuji_ashiato_standard";

  const photoRect = plan.slotsPercent.photo;
  const dateRect = plan.slotsPercent.date;
  const moodRect = plan.slotsPercent.mood;
  const activityRect = plan.slotsPercent.activity;
  const bodyRect = plan.slotsPercent.body;
  const dailyNumberRect = plan.slotsPercent.dailyNumber;
  const readingRect = plan.slotsPercent.reading;

  const previewDate = new Date(entry.createdAt);
  const dateText =
    dateVertical || dateSlashYmd
      ? null
      : getDiaryPreviewDateRowSegments(previewDate)
          .filter((segment) => segment.key !== "label")
          .map((s) => s.text)
          .join(" ");
  const verticalDateColumns = dateVertical
    ? formatAshiatoVerticalDateColumns(previewDate)
    : null;
  const slashYmdDate = dateSlashYmd ? formatAshiatoSlashYmdWeekdayDate(previewDate) : null;
  const verticalDateFontPx = dateRect
    ? ashiatoVerticalDateFontSizePx(dateRect.height)
    : 15;

  const numbers = entry.diaryNumbers ?? { today: "-", month: "-", year: "-" };
  const numberValues = ashiatoDailyNumberValues(plan.templateId, numbers);
  const numberLabels = ashiatoDailyNumberLabels(plan.templateId);
  const numberSlotAlign = ashiatoDailyNumberSlotAlign(plan.templateId);

  const activityLabel = getActivityMeta(entry.activity).label;
  const activityLines = splitFixedWidthJapaneseLines(activityLabel, 12);

  const commentHeading = getCompanionReadingHeading(normalizeCompanionType(entry.companionType));
  const owlComment =
    entry.generatedComment?.trim() ||
    `保存後に「${commentHeading}」がここに入ります。`;
  const commentLayout = resolveDiaryBookEntryV2CommentRenderLayout(owlComment);

  const hasPhoto = entry.hasPhoto === true && Boolean(photoDataUri?.trim());
  const backgroundSrc = resolveImage(plan.backgroundSrc);
  const photoOverlaySrc = plan.photoOverlaySrc ? resolveImage(plan.photoOverlaySrc) : null;
  const moodIconSrc = resolveImage(moodOwlIconImagePath(entry.mood));

  const showPhoto = ashiatoPlanShows(plan, "photo") && photoRect;
  const showDate = ashiatoPlanShows(plan, "date") && dateRect;
  const showMood = ashiatoPlanShows(plan, "mood") && moodRect;
  const showActivity = ashiatoPlanShows(plan, "mood") && activityRect;
  const showBody = ashiatoPlanShows(plan, "body") && bodyRect;
  const showNumbers = ashiatoPlanShows(plan, "dailyNumber") && dailyNumberRect;
  const showReading = ashiatoPlanShows(plan, "reading") && readingRect;

  const bodyLines =
    showBody && entry.content.trim() && plan.bodyWritingMode === "horizontal" && bodyRect
      ? getAshiatoHorizontalBodyLayoutLines(
          entry.content,
          contentFontMode,
          bodyRect,
          plan.bodyTextLayout,
        )
      : [];
  const bodyAlign = plan.bodyTextLayout?.align ?? "left";
  const bodyShrinkChars = plan.bodyTextLayout?.shrinkChars ?? 0;
  const bodySidePadPct =
    bodyShrinkChars > 0
      ? ((bodyShrinkChars / 2) * bodyFont.fontSizePx) / plan.design.widthPx * 100
      : 0;

  let verticalColumns: string[] = [];
  let verticalColumnWidthPct = 0;
  if (showBody && entry.content.trim() && plan.bodyWritingMode === "vertical" && bodyRect) {
    const metrics = resolveAshiatoEnikkiVerticalMetrics(contentFontMode, bodyRect);
    verticalColumns = getAshiatoVerticalBodyColumns(
      entry.content,
      metrics.maxCharsPerColumn,
      metrics.maxColumns,
      plan.verticalBodyTextLayout,
      contentFontMode,
    );
    // 本文枠幅に対する%（PDF の pctStyle 親が本文枠）
    verticalColumnWidthPct = (metrics.columnWidthPx / ashiatoPercentRectToPx(bodyRect).widthPx) * 100;
  }

  return (
    <DiaryBookPdfPageCanvas backgroundSrc={backgroundSrc}>
      {showPhoto && hasPhoto ? (
        <View
          wrap={false}
          style={[
            styles.photoClip,
            pctStyle(photoRect!),
            ...(plan.photoBorderRadiusPx
              ? [{ borderRadius: plan.photoBorderRadiusPx }]
              : []),
            ...(plan.photoRotateDeg
              ? [{ transform: `rotate(${plan.photoRotateDeg}deg)` }]
              : []),
          ]}
        >
          <Image cache={false} src={photoDataUri!} style={styles.photoImage} />
        </View>
      ) : null}

      {photoOverlaySrc ? (
        <Image cache={false} src={photoOverlaySrc} style={diaryBookPdfFullBleedImageStyle} />
      ) : null}

      {showDate && dateSlashYmd && slashYmdDate && plan.dateParts ? (
        <>
          {(
            [
              ["year", slashYmdDate.year],
              ["month", slashYmdDate.month],
              ["day", slashYmdDate.day],
            ] as const
          ).map(([key, text]) => (
            <View
              key={`date-${key}`}
              wrap={false}
              style={[styles.centered, pctStyle(plan.dateParts![key])]}
            >
              <Text
                style={{
                  fontFamily: DIARY_BOOK_ENTRY_V2_LABEL_FONT_FAMILY_PDF,
                  fontWeight: 600,
                  fontSize: diaryBookPdfPct("1.35%", "y"),
                  color: DIARY_BOOK_ENTRY_V2_COLORS.header,
                  textAlign: "center",
                }}
              >
                {text}
              </Text>
            </View>
          ))}
          {slashYmdDate.weekday ? (
            <View
              wrap={false}
              style={[styles.centered, pctStyle(plan.dateParts.weekday)]}
            >
              <Text
                style={{
                  fontFamily: DIARY_BOOK_ENTRY_V2_LABEL_FONT_FAMILY_PDF,
                  fontWeight: 600,
                  fontSize: diaryBookPdfPct("1.25%", "y"),
                  color: DIARY_BOOK_ENTRY_V2_COLORS.header,
                  textAlign: "center",
                  letterSpacing: 1,
                }}
              >
                {slashYmdDate.weekday}
              </Text>
            </View>
          ) : null}
        </>
      ) : null}

      {showDate && dateVertical && verticalDateColumns ? (
        <View
          wrap={false}
          style={{
            ...pctStyle(dateRect!),
            flexDirection: "row-reverse",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {[...verticalDateColumns.dateText].map((ch, charIndex) => (
              <Text
                key={`date-${charIndex}`}
                style={{
                  fontFamily: DIARY_BOOK_ENTRY_V2_LABEL_FONT_FAMILY_PDF,
                  fontWeight: 600,
                  fontSize: diaryBookPdfPct(`${(verticalDateFontPx / 1024) * 100}%`, "y"),
                  color: DIARY_BOOK_ENTRY_V2_COLORS.header,
                  textAlign: "center",
                }}
              >
                {ch}
              </Text>
            ))}
          </View>
          {verticalDateColumns.weekdayText ? (
            <View
              style={{
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                marginRight: diaryBookPdfPct("0.5%", "x"),
              }}
            >
              {[...verticalDateColumns.weekdayText].map((ch, charIndex) => (
                <Text
                  key={`date-wd-${charIndex}`}
                  style={{
                    fontFamily: DIARY_BOOK_ENTRY_V2_LABEL_FONT_FAMILY_PDF,
                    fontWeight: 600,
                    fontSize: diaryBookPdfPct(`${(verticalDateFontPx / 1024) * 100}%`, "y"),
                    color: DIARY_BOOK_ENTRY_V2_COLORS.header,
                    textAlign: "center",
                  }}
                >
                  {ch}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {showDate && !dateVertical && !dateSlashYmd ? (
        <View wrap={false} style={[styles.centered, pctStyle(dateRect!)]}>
          <Text
            style={{
              fontFamily: DIARY_BOOK_ENTRY_V2_LABEL_FONT_FAMILY_PDF,
              fontWeight: 600,
              fontSize: diaryBookPdfPct("1.8%", "y"),
              color: DIARY_BOOK_ENTRY_V2_COLORS.header,
              textAlign: "center",
            }}
          >
            {dateText}
          </Text>
        </View>
      ) : null}

      {showMood ? (
        <Image cache={false} src={moodIconSrc} style={[pctStyle(moodRect!), { objectFit: "contain" }]} />
      ) : null}

      {showActivity ? (
        <View
          wrap={false}
          style={{
            ...pctStyle(activityRect!),
            justifyContent: "center",
          }}
        >
          {activityLines.map((line, index) => (
            <Text
              key={`activity-${index}`}
              style={{
                fontFamily: "NotoSansJP",
                fontWeight: 500,
                fontSize: diaryBookPdfPct("1.45%", "y"),
                color: DIARY_BOOK_ENTRY_V2_COLORS.text,
                lineHeight: 1.25,
              }}
            >
              {line.length > 0 ? line : " "}
            </Text>
          ))}
        </View>
      ) : null}

      {showNumbers
        ? splitDailyNumberSlots(dailyNumberRect!, {
            leftNudgePctByIndex: ashiatoDailyNumberSlotLeftNudgePct(plan.templateId),
          }).map((slot, index) => (
            <View
              key={`num-${index}`}
              wrap={false}
              style={[
                styles.centered,
                pctStyle(slot),
                {
                  flexDirection: "column",
                  justifyContent: numberSlotAlign,
                  alignItems: "center",
                  ...(showNumberLabels
                    ? { paddingBottom: diaryBookPdfPct("1.2%", "y") }
                    : null),
                },
              ]}
            >
              <Text
                style={{
                  fontFamily: "NotoSansJP",
                  fontWeight: 600,
                  fontSize: diaryBookPdfPct("2.2%", "y"),
                  color: DIARY_BOOK_ENTRY_V2_COLORS.numberValue,
                  textAlign: "center",
                }}
              >
                {numberValues[index]}
              </Text>
              {showNumberLabels ? (
                <Text
                  style={{
                    fontFamily: "NotoSansJP",
                    fontWeight: 500,
                    fontSize: diaryBookPdfPct("1.2%", "y"),
                    color: DIARY_BOOK_ENTRY_V2_COLORS.textMuted,
                    textAlign: "center",
                    marginTop: diaryBookPdfPct("0.3%", "y"),
                  }}
                >
                  {numberLabels[index]}
                </Text>
              ) : null}
            </View>
          ))
        : null}

      {showBody && plan.bodyWritingMode === "horizontal" ? (
        <View
          wrap={false}
          style={{
            ...pctStyle(bodyRect!),
            paddingLeft: diaryBookPdfPct(`${0.55 + bodySidePadPct}%`, "x"),
            paddingRight: diaryBookPdfPct(`${0.55 + bodySidePadPct}%`, "x"),
          }}
        >
          {bodyLines.map((line, index) => {
            const indentChars = ashiatoHorizontalBodyLineIndentChars(
              plan.bodyTextLayout,
              index + 1,
              contentFontMode,
            );
            const indentPct =
              indentChars > 0
                ? (indentChars * bodyFont.fontSizePx) / plan.design.widthPx * 100
                : 0;
            return (
              <Text
                key={`body-${index}`}
                style={{
                  fontFamily: "NotoSansJP",
                  fontSize: diaryBookPdfPct(
                    `${(bodyFont.fontSizePx / plan.design.heightPx) * 100}%`,
                    "y",
                  ),
                  color: DIARY_BOOK_ENTRY_V2_COLORS.text,
                  lineHeight: bodyFont.lineHeight,
                  textAlign: bodyAlign,
                  paddingLeft:
                    indentPct > 0 ? diaryBookPdfPct(`${indentPct}%`, "x") : undefined,
                }}
              >
                {line.length > 0 ? line : " "}
              </Text>
            );
          })}
        </View>
      ) : null}

      {showBody && plan.bodyWritingMode === "vertical" ? (
        <View
          wrap={false}
          style={{
            ...pctStyle(bodyRect!),
            flexDirection: "row-reverse",
            alignItems: "flex-start",
          }}
        >
          {verticalColumns.map((column, colIndex) => (
            <View
              key={`col-${colIndex}`}
              style={{
                width: diaryBookPdfPct(`${verticalColumnWidthPct}%`, "x"),
                flexDirection: "column",
              }}
            >
              {[...column].map((ch, charIndex) => (
                <View
                  key={`ch-${colIndex}-${charIndex}`}
                  style={{
                    width: "100%",
                    minHeight: diaryBookPdfPct(
                      `${(bodyFont.fontSizePx / plan.design.heightPx) * 100}%`,
                      "y",
                    ),
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "NotoSansJP",
                      fontSize: diaryBookPdfPct(
                        `${(bodyFont.fontSizePx / plan.design.heightPx) * 100}%`,
                        "y",
                      ),
                      color: DIARY_BOOK_ENTRY_V2_COLORS.text,
                      textAlign: "center",
                    }}
                  >
                    {ashiatoVerticalDisplayChar(ch)}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      ) : null}

      {showReading ? (
        <View wrap={false} style={pctStyle(readingRect!)}>
          <Text
            style={{
              fontFamily: "NotoSansJP",
              fontSize: diaryBookPdfPct("1.5%", "y") * commentLayout.fontScale,
              color: DIARY_BOOK_ENTRY_V2_COLORS.text,
              lineHeight: 1.5,
            }}
          >
            {owlComment}
          </Text>
        </View>
      ) : null}
    </DiaryBookPdfPageCanvas>
  );
}
