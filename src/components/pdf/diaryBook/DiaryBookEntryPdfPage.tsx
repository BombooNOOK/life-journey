import React from "react";
import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";

import { DiaryBookPdfPageCanvas } from "@/components/pdf/diaryBook/DiaryBookPdfPageCanvas";
import type { BoundDiaryEntry } from "@/components/journal/DiaryYearBoundPages";
import { normalizeContentFontMode } from "@/lib/journal/contentFontMode";
import { getBodyLayoutLinesForBindingPreview } from "@/lib/journal/diaryPreviewBodyLineLimits";
import { resolveDiaryCommentPdfRenderLayout } from "@/lib/journal/diaryCommentPdfWrap";
import {
  DIARY_PREVIEW_ACTIVITY_ANSWER_SLOT_HEIGHT_PX,
  DIARY_PREVIEW_ACTIVITY_ANSWER_TEXT_NUDGE_Y_PX,
  getDiaryPreviewActivityAnswerSlotTopPx,
  getDiaryPreviewActivityQuestionCenterYPx,
  DIARY_PREVIEW_ACTIVITY_LABEL_STYLE,
  DIARY_PREVIEW_ACTIVITY_QUESTION_TEXT,
  DIARY_PREVIEW_BODY_TEXT_COLOR,
  getDiaryPreviewActivityAnswerLeftPct,
  getDiaryPreviewActivityAnswerWidthPct,
  getDiaryPreviewActivityQuestionLabelLeftPx,
  DIARY_PREVIEW_BODY_LABEL_STYLE,
  DIARY_PREVIEW_BODY_LABEL_TEXT,
  getDiaryPreviewBodyLabelCenterYPx,
  getDiaryPreviewBodyLabelLeftPx,
  DIARY_PREVIEW_COMMENT_INNER_PADDING,
  DIARY_PREVIEW_COMMENT_LABEL_STYLE,
  DIARY_PREVIEW_COMMENT_TEXT_STYLE,
  getDiaryPreviewCommentLabelCenterYPx,
  getDiaryPreviewCommentLabelLeftPx,
  getFixedPreviewCommentBoxPx,
  DIARY_PREVIEW_DATE_ROW_STYLE,
  getDiaryPreviewDateRowSegments,
  getDiaryPreviewDateRowTextStyle,
  getDiaryPreviewDateRowTopPx,
  DIARY_PREVIEW_MOOD_EMOJI,
  DIARY_PREVIEW_NUMBER_STYLE,
  DIARY_PREVIEW_NUMBER_MOOD_LABEL_STYLE,
  DIARY_PREVIEW_NUMBER_MOOD_ROWS,
  getDiaryPreviewMoodSlotCenterYPx,
  getDiaryPreviewNumberMoodLabelLeftPx,
  getDiaryPreviewNumberMoodValueCenterXPx,
  getDiaryPreviewNumberSlotCenterYPx,
  getDiaryPreviewNumberTextStyle,
  DIARY_PREVIEW_TITLE_PDF_FONT,
  DIARY_PREVIEW_TITLE_REGION,
  DIARY_PREVIEW_TITLE_STYLE,
  DIARY_PREVIEW_TITLE_TEXT,
  DIARY_PREVIEW_PHOTO_LABEL_STYLE,
  DIARY_PREVIEW_PHOTO_LABEL_TEXT,
  DIARY_PREVIEW_PHOTO_REGION,
  getDiaryPreviewBodySafeScrollHeightPx,
  getFixedPreviewActivityTextStyle,
  getFixedPreviewBodyBoxPx,
  getFixedPreviewBodyTextStyle,
  regionBoxToPx,
} from "@/lib/journal/diaryPreviewFixedLayout";
import { resolveDiaryBookPublicImagePath } from "@/lib/journal/diaryBookPrintPdfAssets";
import { moodOwlIconImagePath } from "@/lib/journal/moodAssets";
import { getActivityMeta, getCompanionReadingHeading, normalizeCompanionType } from "@/lib/journal/meta";
import {
  diaryBookPdfPct,
  diaryBookPdfPx,
  parseCssPx,
} from "@/lib/journal/diaryBookPrintPdfLayout";

const styles = StyleSheet.create({
  dateRow: {
    position: "absolute",
    left: 0,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dateText: {
    fontFamily: "NotoSansJP",
    color: DIARY_PREVIEW_DATE_ROW_STYLE.color,
    lineHeight: 1,
    fontWeight: DIARY_PREVIEW_DATE_ROW_STYLE.fontWeight,
  },
  activityQuestionLabel: {
    position: "absolute",
    justifyContent: "center",
    fontFamily: "NotoSansJP",
    color: DIARY_PREVIEW_ACTIVITY_LABEL_STYLE.color,
    fontWeight: DIARY_PREVIEW_ACTIVITY_LABEL_STYLE.fontWeight,
  },
  activityBox: {
    position: "absolute",
    fontFamily: "NotoSansJP",
    color: DIARY_PREVIEW_BODY_TEXT_COLOR,
    overflow: "hidden",
  },
  activityText: {
    fontFamily: "NotoSansJP",
    color: DIARY_PREVIEW_BODY_TEXT_COLOR,
    width: "100%",
  },
  bodyQuestionLabel: {
    position: "absolute",
    justifyContent: "center",
    fontFamily: "NotoSansJP",
    color: DIARY_PREVIEW_BODY_LABEL_STYLE.color,
    fontWeight: DIARY_PREVIEW_BODY_LABEL_STYLE.fontWeight,
  },
  bodyBox: {
    position: "absolute",
    overflow: "hidden",
    fontFamily: "NotoSansJP",
    color: DIARY_PREVIEW_BODY_TEXT_COLOR,
  },
  bodyLine: {
    fontFamily: "NotoSansJP",
    color: DIARY_PREVIEW_BODY_TEXT_COLOR,
    width: "100%",
  },
  commentLabel: {
    position: "absolute",
    justifyContent: "center",
    fontFamily: "NotoSansJP",
    color: DIARY_PREVIEW_COMMENT_LABEL_STYLE.color,
    fontWeight: DIARY_PREVIEW_COMMENT_LABEL_STYLE.fontWeight,
  },
  commentBox: {
    position: "absolute",
    overflow: "hidden",
    flexDirection: "column",
    fontFamily: "NotoSansJP",
    color: DIARY_PREVIEW_BODY_TEXT_COLOR,
  },
  commentText: {
    fontFamily: "NotoSansJP",
    color: DIARY_PREVIEW_BODY_TEXT_COLOR,
    width: "100%",
  },
  numberSlot: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "NotoSansJP",
    fontWeight: DIARY_PREVIEW_NUMBER_STYLE.fontWeight,
    color: DIARY_PREVIEW_NUMBER_STYLE.color,
    textAlign: "center",
  },
  numberLabel: {
    position: "absolute",
    justifyContent: "center",
    fontFamily: "NotoSansJP",
    color: DIARY_PREVIEW_NUMBER_MOOD_LABEL_STYLE.color,
    fontWeight: DIARY_PREVIEW_NUMBER_MOOD_LABEL_STYLE.fontWeight,
  },
  moodSlot: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  moodIconImage: {
    objectFit: "contain",
  },
  photoLabel: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "NotoSansJP",
    color: DIARY_PREVIEW_PHOTO_LABEL_STYLE.color,
    fontWeight: DIARY_PREVIEW_PHOTO_LABEL_STYLE.fontWeight,
    textAlign: "center",
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
  titleBox: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontFamily: DIARY_PREVIEW_TITLE_PDF_FONT,
    color: "#574129",
    textAlign: "center",
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
  const previewDate = new Date(entry.createdAt);
  const dateRowSegments = getDiaryPreviewDateRowSegments(previewDate);
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

  const bodyRegion = getFixedPreviewBodyBoxPx();
  const commentRegion = getFixedPreviewCommentBoxPx();
  const commentPadding = parsePadding(DIARY_PREVIEW_COMMENT_INNER_PADDING);
  const bodyClipHeight = diaryBookPdfPx(bodyRegion.height, "y");
  const bodyWidth = diaryBookPdfPx(bodyRegion.width, "x");
  const bodyLabelLeft = diaryBookPdfPx(getDiaryPreviewBodyLabelLeftPx(), "x");
  const bodyLabelFontSize = diaryBookPdfPx(
    parseCssPx(DIARY_PREVIEW_BODY_LABEL_STYLE.fontSize),
    "x",
  );
  const bodyLabelCenterY = diaryBookPdfPx(getDiaryPreviewBodyLabelCenterYPx(), "y");
  const bodyLabelRowHeight = diaryBookPdfPx(DIARY_PREVIEW_NUMBER_STYLE.slotHeightPx, "y");

  const commentHeading = getCompanionReadingHeading(normalizeCompanionType(entry.companionType));
  const owlComment =
    entry.generatedComment?.trim() ||
    `保存後に「${commentHeading}」がここに入ります。`;
  const numbers = entry.diaryNumbers ?? {
    today: "-",
    month: "-",
    year: "-",
    calmness: "-",
  };

  const dateTextStyle = getDiaryPreviewDateRowTextStyle(contentFontMode);
  const dateFontSize = diaryBookPdfPx(parseCssPx(dateTextStyle.fontSize), "x");
  const bodyFontSize = diaryBookPdfPx(parseCssPx(bodyTextStyle.fontSize), "x");
  const bodyLineHeight = parseFloat(bodyTextStyle.lineHeight) || 1.575;
  const activityFontSize = diaryBookPdfPx(parseCssPx(activityTextStyle.fontSize), "x");
  const activityWidth = diaryBookPdfPct(getDiaryPreviewActivityAnswerWidthPct(), "x");
  const activityQuestionLabelLeft = diaryBookPdfPx(
    getDiaryPreviewActivityQuestionLabelLeftPx(),
    "x",
  );
  const activityQuestionLabelFontSize = diaryBookPdfPx(
    parseCssPx(DIARY_PREVIEW_ACTIVITY_LABEL_STYLE.fontSize),
    "x",
  );
  const activityQuestionCenterY = diaryBookPdfPx(
    getDiaryPreviewActivityQuestionCenterYPx(),
    "y",
  );
  const commentBaseFontSize = diaryBookPdfPx(
    parseCssPx(DIARY_PREVIEW_COMMENT_TEXT_STYLE.fontSize),
    "x",
  );
  const commentRegionHeight = diaryBookPdfPx(commentRegion.height, "y");
  const commentInnerHeight =
    commentRegionHeight - commentPadding.top - commentPadding.bottom;
  const commentLayout = resolveDiaryCommentPdfRenderLayout(owlComment, {
    baseFontSizePx: commentBaseFontSize,
    regionHeightPx: commentInnerHeight,
  });
  const commentLines = commentLayout.lines;
  const commentFontSize = commentBaseFontSize * commentLayout.fontScale;
  const commentLineHeight = commentLayout.lineHeight;
  const commentWidth =
    diaryBookPdfPx(commentRegion.width, "x") -
    commentPadding.left -
    commentPadding.right;
  const commentLabelLeft = diaryBookPdfPx(getDiaryPreviewCommentLabelLeftPx(), "x");
  const commentLabelFontSize = diaryBookPdfPx(
    parseCssPx(DIARY_PREVIEW_COMMENT_LABEL_STYLE.fontSize),
    "x",
  );
  const commentLabelCenterY = diaryBookPdfPx(getDiaryPreviewCommentLabelCenterYPx(), "y");
  const commentLabelRowHeight = diaryBookPdfPx(DIARY_PREVIEW_NUMBER_STYLE.slotHeightPx, "y");
  const numberTextStyle = getDiaryPreviewNumberTextStyle(contentFontMode);
  const numberFontSize = diaryBookPdfPx(parseCssPx(numberTextStyle.fontSize), "x");

  const titleRegion = regionBoxToPx(DIARY_PREVIEW_TITLE_REGION);
  const titleFontSize = diaryBookPdfPx(parseCssPx(DIARY_PREVIEW_TITLE_STYLE.fontSize), "x");

  const numberSlotWidth = diaryBookPdfPx(DIARY_PREVIEW_NUMBER_STYLE.slotWidthPx, "x");
  const numberSlotHeight = diaryBookPdfPx(DIARY_PREVIEW_NUMBER_STYLE.slotHeightPx, "y");
  const moodBoxSize = diaryBookPdfPx(DIARY_PREVIEW_MOOD_EMOJI.boxPx, "x");
  const numberCenterX = diaryBookPdfPx(getDiaryPreviewNumberMoodValueCenterXPx(), "x");
  const numberLabelLeft = diaryBookPdfPx(getDiaryPreviewNumberMoodLabelLeftPx(), "x");
  const numberLabelFontSize = diaryBookPdfPx(
    parseCssPx(DIARY_PREVIEW_NUMBER_MOOD_LABEL_STYLE.fontSize),
    "x",
  );
  const numberLabelRowHeight = diaryBookPdfPx(DIARY_PREVIEW_NUMBER_STYLE.slotHeightPx, "y");

  const photoSize = diaryBookPdfPx(DIARY_PREVIEW_PHOTO_REGION.sizePx, "x");
  const photoLeft = diaryBookPdfPx(DIARY_PREVIEW_PHOTO_REGION.leftPx, "x");
  const photoTop = diaryBookPdfPx(DIARY_PREVIEW_PHOTO_REGION.topPx, "y");
  const photoLabelFontSize = diaryBookPdfPx(
    parseCssPx(DIARY_PREVIEW_PHOTO_LABEL_STYLE.fontSize),
    "x",
  );
  const photoLabelRowHeight = diaryBookPdfPx(DIARY_PREVIEW_NUMBER_STYLE.slotHeightPx, "y");
  const photoLabelCenterX = diaryBookPdfPx(DIARY_PREVIEW_PHOTO_REGION.labelCenterXPx, "x");
  const photoLabelCenterY = diaryBookPdfPx(DIARY_PREVIEW_PHOTO_REGION.labelCenterYPx, "y");

  const hasPhoto = entry.hasPhoto === true && Boolean(photoDataUri?.trim());

  const dateSegmentGap = diaryBookPdfPx(DIARY_PREVIEW_DATE_ROW_STYLE.segmentGapPx, "x");
  const dateRowTop = diaryBookPdfPx(getDiaryPreviewDateRowTopPx(contentFontMode), "y");

  const numberSlots = [
    { key: "today" as const, value: String(numbers.today) },
    { key: "month" as const, value: String(numbers.month) },
    { key: "year" as const, value: String(numbers.year) },
  ] as const;

  return (
    <DiaryBookPdfPageCanvas backgroundSrc={templateSrc}>
        <View
          wrap={false}
          style={[
            styles.titleBox,
            {
              left: diaryBookPdfPx(titleRegion.left, "x"),
              top: diaryBookPdfPx(titleRegion.top, "y"),
              width: diaryBookPdfPx(titleRegion.width, "x"),
              height: diaryBookPdfPx(titleRegion.height, "y"),
            },
          ]}
        >
          <Text
            wrap={false}
            style={[
              styles.titleText,
              {
                fontSize: titleFontSize,
                letterSpacing: parseFloat(DIARY_PREVIEW_TITLE_STYLE.letterSpacing) * titleFontSize,
              },
            ]}
          >
            {DIARY_PREVIEW_TITLE_TEXT}
          </Text>
        </View>

        <View wrap={false} style={[styles.dateRow, { top: dateRowTop }]}>
          {dateRowSegments.map((segment, index) => (
            <Text
              key={segment.key}
              wrap={false}
              style={[
                styles.dateText,
                {
                  fontSize: dateFontSize,
                  marginLeft: index === 0 ? 0 : dateSegmentGap,
                  letterSpacing:
                    parseFloat(DIARY_PREVIEW_DATE_ROW_STYLE.letterSpacing) * dateFontSize,
                },
              ]}
            >
              {segment.text}
            </Text>
          ))}
        </View>

        <View
          wrap={false}
          style={[
            styles.activityQuestionLabel,
            {
              left: activityQuestionLabelLeft,
              top: activityQuestionCenterY,
              height: diaryBookPdfPx(DIARY_PREVIEW_NUMBER_STYLE.slotHeightPx, "y"),
              marginTop: -(diaryBookPdfPx(DIARY_PREVIEW_NUMBER_STYLE.slotHeightPx, "y") / 2),
              fontSize: activityQuestionLabelFontSize,
              letterSpacing:
                parseFloat(DIARY_PREVIEW_ACTIVITY_LABEL_STYLE.letterSpacing) *
                activityQuestionLabelFontSize,
            },
          ]}
        >
          <Text wrap={false} style={{ fontSize: activityQuestionLabelFontSize, lineHeight: 1 }}>
            {DIARY_PREVIEW_ACTIVITY_QUESTION_TEXT}
          </Text>
        </View>

        <View
          wrap={false}
          style={[
            styles.activityBox,
            {
              left: diaryBookPdfPct(getDiaryPreviewActivityAnswerLeftPct(), "x"),
              top: diaryBookPdfPx(getDiaryPreviewActivityAnswerSlotTopPx(), "y"),
              width: activityWidth,
              height: diaryBookPdfPx(DIARY_PREVIEW_ACTIVITY_ANSWER_SLOT_HEIGHT_PX, "y"),
              fontSize: activityFontSize,
              lineHeight: 1.25,
              justifyContent: "center",
            },
          ]}
        >
          <Text
            wrap
            style={[
              styles.activityText,
              {
                fontSize: activityFontSize,
                lineHeight: 1.25,
                marginTop: diaryBookPdfPx(DIARY_PREVIEW_ACTIVITY_ANSWER_TEXT_NUDGE_Y_PX, "y"),
              },
            ]}
          >
            {trimmedActivity}
          </Text>
        </View>

        <View
          wrap={false}
          style={[
            styles.bodyQuestionLabel,
            {
              left: bodyLabelLeft,
              top: bodyLabelCenterY,
              height: bodyLabelRowHeight,
              marginTop: -bodyLabelRowHeight / 2,
              fontSize: bodyLabelFontSize,
              letterSpacing:
                parseFloat(DIARY_PREVIEW_BODY_LABEL_STYLE.letterSpacing) * bodyLabelFontSize,
            },
          ]}
        >
          <Text
            wrap={false}
            style={{
              fontSize: bodyLabelFontSize,
              lineHeight: 1,
              fontWeight: DIARY_PREVIEW_BODY_LABEL_STYLE.fontWeight,
            }}
          >
            {DIARY_PREVIEW_BODY_LABEL_TEXT}
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
            styles.commentLabel,
            {
              left: commentLabelLeft,
              top: commentLabelCenterY,
              height: commentLabelRowHeight,
              marginTop: -commentLabelRowHeight / 2,
              fontSize: commentLabelFontSize,
              letterSpacing:
                parseFloat(DIARY_PREVIEW_COMMENT_LABEL_STYLE.letterSpacing) *
                commentLabelFontSize,
            },
          ]}
        >
          <Text
            wrap={false}
            style={{
              fontSize: commentLabelFontSize,
              lineHeight: 1,
              fontWeight: DIARY_PREVIEW_COMMENT_LABEL_STYLE.fontWeight,
            }}
          >
            {commentHeading}
          </Text>
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
          {commentLines.map((line, index) => (
            <Text
              key={`comment-line-${index}`}
              wrap={false}
              style={[
                styles.commentText,
                {
                  fontSize: commentFontSize,
                  lineHeight: commentLineHeight,
                  width: commentWidth,
                },
              ]}
            >
              {line.length > 0 ? line : " "}
            </Text>
          ))}
        </View>

        {DIARY_PREVIEW_NUMBER_MOOD_ROWS.map((row) => (
          <View
            key={`${row.key}-label`}
            wrap={false}
            style={[
              styles.numberLabel,
              {
                left: numberLabelLeft,
                top: diaryBookPdfPx(row.centerYPx, "y") - numberLabelRowHeight / 2,
                height: numberLabelRowHeight,
              },
            ]}
          >
            <Text
              wrap={false}
              style={{
                fontSize: numberLabelFontSize,
                lineHeight: 1,
                letterSpacing:
                  parseFloat(DIARY_PREVIEW_NUMBER_MOOD_LABEL_STYLE.letterSpacing) *
                  numberLabelFontSize,
              }}
            >
              {row.label}
            </Text>
          </View>
        ))}

        {numberSlots.map((slot) => (
          <View
            key={slot.key}
            wrap={false}
            style={[
              styles.numberSlot,
              {
                left: numberCenterX - numberSlotWidth / 2,
                top:
                  diaryBookPdfPx(getDiaryPreviewNumberSlotCenterYPx(slot.key), "y") -
                  numberSlotHeight / 2,
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
              top: diaryBookPdfPx(getDiaryPreviewMoodSlotCenterYPx(), "y") - moodBoxSize / 2,
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
              width: photoSize,
              height: photoSize,
            },
          ]}
        >
          {hasPhoto ? (
            <Image cache={false} src={photoDataUri!} style={styles.photoImage} />
          ) : null}
        </View>

        <View
          wrap={false}
          style={[
            styles.photoLabel,
            {
              left: photoLabelCenterX - photoSize / 2,
              top: photoLabelCenterY - photoLabelRowHeight / 2,
              width: photoSize,
              height: photoLabelRowHeight,
            },
          ]}
        >
          <Text
            wrap={false}
            style={{
              fontSize: photoLabelFontSize,
              lineHeight: 1,
              fontWeight: DIARY_PREVIEW_PHOTO_LABEL_STYLE.fontWeight,
              letterSpacing:
                parseFloat(DIARY_PREVIEW_PHOTO_LABEL_STYLE.letterSpacing) * photoLabelFontSize,
            }}
          >
            {DIARY_PREVIEW_PHOTO_LABEL_TEXT}
          </Text>
        </View>
    </DiaryBookPdfPageCanvas>
  );
}
