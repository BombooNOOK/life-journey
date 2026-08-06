"use client";

import type { CSSProperties } from "react";

import {
  ashiatoLayoutRectStyle,
  type AshiatoLayoutPercentRect,
} from "@/lib/journal/ashiatoPageTemplateLayout";
import {
  ashiatoDailyNumberLabels,
  ashiatoDailyNumberSlotAlign,
  ashiatoDailyNumberSlotLeftNudgePct,
  ashiatoDailyNumberValues,
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
import { diaryBookPhotoMemoryLoadingImagePath } from "@/lib/journal/diaryBookAssets";
import { getDiaryBookEntryV2BodyFontLayout } from "@/lib/journal/diaryBookEntryBodyFontLayout";
import { resolveDiaryBookEntryV2CommentRenderLayout } from "@/lib/journal/diaryBookEntryCommentWrap";
import { DIARY_PREVIEW_BODY_FONT_FAMILY } from "@/lib/journal/diaryPreviewBodyFont";
import { DIARY_PREVIEW_LABEL_BASE_STYLE } from "@/lib/journal/diaryPreviewLabelFont";
import { getDiaryPreviewDateRowSegments } from "@/lib/journal/diaryPreviewFixedLayout";
import { normalizeContentFontMode } from "@/lib/journal/contentFontMode";
import { JOURNAL_OWL_COMMENT_KANTEI_REQUIRED_MESSAGE } from "@/lib/journal/kanteiCommentCopy";
import { getActivityMeta, getCompanionReadingHeading, normalizeCompanionType } from "@/lib/journal/meta";
import { moodOwlIconImagePath } from "@/lib/journal/moodAssets";
import { DIARY_BOOK_ENTRY_V2_COLORS } from "@/lib/journal/diaryBookEntryPrintLayout";
import { splitFixedWidthJapaneseLines } from "@/lib/pdf/splitFixedWidthJapaneseLines";

export type DiaryBookAshiatoEntryPreviewPageProps = {
  pageTemplate?: string | null;
  companionType?: string | null;
  mood: string;
  activity?: string | null;
  content: string;
  comment?: string | null;
  photoDataUrl?: string | null;
  photoSrc?: string | null;
  photoLoading?: boolean;
  previewDate?: Date;
  diaryNumbers?: {
    today: number | string;
    month: number | string;
    year: number | string;
  };
  contentFontMode?: string | null;
  kanteiOrderExists?: boolean;
  /** レイヤー型テンプレ：preview 合成画像を背景に使う（開発プレビュー用） */
  preferLayeredPreviewComposite?: boolean;
};

function pctBox(rect: AshiatoLayoutPercentRect, extra?: CSSProperties): CSSProperties {
  return { ...ashiatoLayoutRectStyle(rect), ...extra };
}

/**
 * あしあとブック本文（テンプレ別・%配置）。
 * ラベル類はテンプレ画像側に焼き込み。動的要素のみ重ねる。
 */
export function DiaryBookAshiatoEntryPreviewPage({
  pageTemplate,
  companionType,
  mood,
  activity,
  content,
  comment,
  photoDataUrl,
  photoSrc,
  photoLoading = false,
  previewDate = new Date(),
  diaryNumbers,
  contentFontMode: contentFontModeProp,
  kanteiOrderExists,
  preferLayeredPreviewComposite = false,
}: DiaryBookAshiatoEntryPreviewPageProps) {
  const plan = resolveAshiatoEntryRenderPlan({
    pageTemplate,
    companionType,
    preferLayeredPreviewComposite,
  });
  const contentFontMode = normalizeContentFontMode(contentFontModeProp);
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

  const numbers = diaryNumbers ?? { today: "-", month: "-", year: "-" };
  const numberValues = ashiatoDailyNumberValues(plan.templateId, numbers);
  const numberLabels = ashiatoDailyNumberLabels(plan.templateId);
  const numberSlotAlign = ashiatoDailyNumberSlotAlign(plan.templateId);

  const activityLabel = getActivityMeta(activity?.trim() || "record_anyway").label;
  const activityLines = splitFixedWidthJapaneseLines(activityLabel, 12);

  const commentHeading = getCompanionReadingHeading(normalizeCompanionType(companionType));
  const owlComment =
    comment?.trim() ||
    (kanteiOrderExists === false
      ? JOURNAL_OWL_COMMENT_KANTEI_REQUIRED_MESSAGE
      : `保存後に「${commentHeading}」がここに入ります。`);
  const commentLayout = resolveDiaryBookEntryV2CommentRenderLayout(owlComment);

  const photoDisplaySrc = photoDataUrl?.trim() || photoSrc?.trim() || "";
  const hasPhoto = Boolean(photoDisplaySrc);
  const showPhotoLoading = photoLoading && !hasPhoto;

  const showPhoto = ashiatoPlanShows(plan, "photo") && photoRect;
  const showDate = ashiatoPlanShows(plan, "date") && dateRect;
  const showMood = ashiatoPlanShows(plan, "mood") && moodRect;
  const showActivity = ashiatoPlanShows(plan, "mood") && activityRect;
  const showBody = ashiatoPlanShows(plan, "body") && bodyRect;
  const showNumbers = ashiatoPlanShows(plan, "dailyNumber") && dailyNumberRect;
  const showReading = ashiatoPlanShows(plan, "reading") && readingRect;

  let bodyHorizontalLines: string[] = [];
  if (showBody && content.trim() && plan.bodyWritingMode === "horizontal" && bodyRect) {
    // 本文枠幅で折り返す（v2固定字数に落とすと1字だけはみ出し→CSS二次改行の原因）
    bodyHorizontalLines = getAshiatoHorizontalBodyLayoutLines(
      content,
      contentFontMode,
      bodyRect,
      plan.bodyTextLayout,
    );
  }

  let bodyVerticalColumns: string[] = [];
  let bodyVerticalColumnWidthPx = 0;
  let bodyVerticalCharHeightPx = bodyFont.fontSizePx;
  if (showBody && content.trim() && plan.bodyWritingMode === "vertical" && bodyRect) {
    const metrics = resolveAshiatoEnikkiVerticalMetrics(contentFontMode, bodyRect);
    bodyVerticalColumns = getAshiatoVerticalBodyColumns(
      content,
      metrics.maxCharsPerColumn,
      metrics.maxColumns,
      plan.verticalBodyTextLayout,
      contentFontMode,
    );
    // 設計pxで指定（親が本文枠でもページ%だと列幅が狂って罫線から外れる）
    bodyVerticalColumnWidthPx = metrics.columnWidthPx;
    bodyVerticalCharHeightPx = metrics.charCellPx;
  }

  const bodyAlign = plan.bodyTextLayout?.align ?? "left";
  const bodyShrinkChars = plan.bodyTextLayout?.shrinkChars ?? 0;
  const bodySidePadPx =
    bodyShrinkChars > 0 ? (bodyShrinkChars / 2) * bodyFont.fontSizePx : 0;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: `${plan.design.widthPx}px`,
        height: `${plan.design.heightPx}px`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        src={plan.backgroundSrc}
        className="absolute inset-0 h-full w-full object-fill"
        draggable={false}
      />

      {showPhoto && hasPhoto ? (
        <div
          className="absolute overflow-hidden"
          style={{
            ...pctBox(photoRect!),
            borderRadius: plan.photoBorderRadiusPx
              ? `${plan.photoBorderRadiusPx}px`
              : undefined,
            transform: plan.photoRotateDeg ? `rotate(${plan.photoRotateDeg}deg)` : undefined,
            transformOrigin: "center center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            src={photoDisplaySrc}
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
        </div>
      ) : null}

      {showPhoto && showPhotoLoading ? (
        <div
          className="absolute overflow-hidden"
          style={{
            ...pctBox(photoRect!),
            borderRadius: plan.photoBorderRadiusPx
              ? `${plan.photoBorderRadiusPx}px`
              : undefined,
            transform: plan.photoRotateDeg ? `rotate(${plan.photoRotateDeg}deg)` : undefined,
            transformOrigin: "center center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            src={diaryBookPhotoMemoryLoadingImagePath()}
            className="absolute inset-0 h-full w-full object-contain opacity-80"
            draggable={false}
          />
        </div>
      ) : null}

      {plan.photoOverlaySrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          src={plan.photoOverlaySrc}
          className="pointer-events-none absolute inset-0 h-full w-full object-fill"
          draggable={false}
        />
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
            <div
              key={`date-${key}`}
              className="absolute flex items-center justify-center overflow-hidden text-center"
              style={{
                ...pctBox(plan.dateParts![key]),
                ...DIARY_PREVIEW_LABEL_BASE_STYLE,
                fontSize: "13px",
                fontWeight: 600,
                color: DIARY_BOOK_ENTRY_V2_COLORS.header,
              }}
            >
              {text}
            </div>
          ))}
          {slashYmdDate.weekday ? (
            <div
              className="absolute flex items-center justify-center overflow-hidden text-center"
              style={{
                ...pctBox(plan.dateParts.weekday),
                ...DIARY_PREVIEW_LABEL_BASE_STYLE,
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                color: DIARY_BOOK_ENTRY_V2_COLORS.header,
              }}
            >
              {slashYmdDate.weekday}
            </div>
          ) : null}
        </>
      ) : null}

      {showDate && !dateSlashYmd ? (
        <div
          className="absolute flex items-center justify-center overflow-hidden px-1 text-center"
          style={{
            ...pctBox(dateRect!),
            ...DIARY_PREVIEW_LABEL_BASE_STYLE,
            fontSize: dateVertical ? `${verticalDateFontPx}px` : "15px",
            fontWeight: 600,
            color: DIARY_BOOK_ENTRY_V2_COLORS.header,
            ...(dateVertical
              ? {
                  flexDirection: "row-reverse",
                  gap: "0.2em",
                  alignItems: "center",
                  justifyContent: "center",
                }
              : null),
          }}
        >
          {dateVertical && verticalDateColumns ? (
            <>
              <span
                style={{
                  writingMode: "vertical-rl",
                  textOrientation: "upright",
                  letterSpacing: "0.06em",
                  lineHeight: 1.1,
                }}
              >
                {verticalDateColumns.dateText}
              </span>
              {verticalDateColumns.weekdayText ? (
                <span
                  style={{
                    writingMode: "vertical-rl",
                    textOrientation: "upright",
                    letterSpacing: "0.06em",
                    lineHeight: 1.1,
                  }}
                >
                  {verticalDateColumns.weekdayText}
                </span>
              ) : null}
            </>
          ) : (
            dateText
          )}
        </div>
      ) : null}

      {showMood ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          src={moodOwlIconImagePath(mood)}
          className="absolute object-contain"
          style={pctBox(moodRect!)}
        />
      ) : null}

      {showActivity ? (
        <div
          className="absolute flex items-center overflow-hidden"
          style={pctBox(activityRect!)}
        >
          <div
            style={{
              fontFamily: DIARY_PREVIEW_BODY_FONT_FAMILY,
              fontSize: "13px",
              fontWeight: 500,
              lineHeight: 1.25,
              letterSpacing: "0.04em",
              color: DIARY_BOOK_ENTRY_V2_COLORS.text,
            }}
          >
            {activityLines.map((line, index) => (
              <div key={`activity-${index}`}>{line.length > 0 ? line : "\u00a0"}</div>
            ))}
          </div>
        </div>
      ) : null}

      {showNumbers
        ? splitDailyNumberSlots(dailyNumberRect!, {
            leftNudgePctByIndex: ashiatoDailyNumberSlotLeftNudgePct(plan.templateId),
          }).map((slot, index) => (
            <div
              key={`num-${index}`}
              className="absolute flex flex-col items-center"
              style={{
                ...pctBox(slot),
                justifyContent: numberSlotAlign,
                paddingBottom: showNumberLabels ? "2%" : undefined,
                fontFamily: DIARY_PREVIEW_BODY_FONT_FAMILY,
                color: DIARY_BOOK_ENTRY_V2_COLORS.numberValue,
              }}
            >
              <div style={{ fontSize: "20px", fontWeight: 600, lineHeight: 1 }}>
                {numberValues[index]}
              </div>
              {showNumberLabels ? (
                <div
                  style={{
                    marginTop: "2px",
                    fontSize: "11px",
                    fontWeight: 500,
                    lineHeight: 1,
                    color: DIARY_BOOK_ENTRY_V2_COLORS.textMuted,
                  }}
                >
                  {numberLabels[index]}
                </div>
              ) : null}
            </div>
          ))
        : null}

      {showBody && plan.bodyWritingMode === "horizontal" ? (
        <div
          className="absolute overflow-hidden"
          style={{
            ...pctBox(bodyRect!),
            paddingLeft: `${4 + bodySidePadPx}px`,
            paddingRight: `${4 + bodySidePadPx}px`,
            paddingTop: "4px",
            paddingBottom: "4px",
          }}
        >
          <div
            style={{
              fontFamily: DIARY_PREVIEW_BODY_FONT_FAMILY,
              fontSize: `${bodyFont.fontSizePx}px`,
              lineHeight: bodyFont.lineHeight,
              color: DIARY_BOOK_ENTRY_V2_COLORS.text,
              textAlign: bodyAlign,
            }}
          >
            {bodyHorizontalLines.map((line, index) => {
              const indentChars = ashiatoHorizontalBodyLineIndentChars(
                plan.bodyTextLayout,
                index + 1,
                contentFontMode,
              );
              return (
                <div
                  key={`body-${index}`}
                  style={{
                    minHeight: `${bodyFont.fontSizePx * bodyFont.lineHeight}px`,
                    textAlign: bodyAlign,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    paddingLeft:
                      indentChars > 0 ? `${indentChars * bodyFont.fontSizePx}px` : undefined,
                  }}
                >
                  {line.length > 0 ? line : "\u00a0"}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {showBody && plan.bodyWritingMode === "vertical" && bodyVerticalColumns.length > 0 ? (
        <div
          className="absolute overflow-hidden"
          style={{
            ...pctBox(bodyRect!),
            display: "flex",
            flexDirection: "row-reverse",
            alignItems: "flex-start",
            boxSizing: "border-box",
            fontFamily: DIARY_PREVIEW_BODY_FONT_FAMILY,
            fontSize: `${bodyFont.fontSizePx}px`,
            color: DIARY_BOOK_ENTRY_V2_COLORS.text,
          }}
        >
          {bodyVerticalColumns.map((column, colIndex) => (
            <div
              key={`col-${colIndex}`}
              style={{
                width: `${bodyVerticalColumnWidthPx}px`,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {[...column].map((ch, charIndex) => (
                <span
                  key={`ch-${colIndex}-${charIndex}`}
                  style={{
                    display: "flex",
                    width: "100%",
                    height: `${bodyVerticalCharHeightPx}px`,
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                    textAlign: "center",
                  }}
                >
                  {ch === "　" ? "\u00a0" : ashiatoVerticalDisplayChar(ch)}
                </span>
              ))}
            </div>
          ))}
        </div>
      ) : null}

      {showReading ? (
        <div
          className="absolute overflow-hidden p-1"
          style={{
            ...pctBox(readingRect!),
            fontFamily: DIARY_PREVIEW_BODY_FONT_FAMILY,
            fontSize: `${15 * commentLayout.fontScale}px`,
            lineHeight: 1.55,
            color: DIARY_BOOK_ENTRY_V2_COLORS.text,
          }}
        >
          {owlComment}
        </div>
      ) : null}
    </div>
  );
}
