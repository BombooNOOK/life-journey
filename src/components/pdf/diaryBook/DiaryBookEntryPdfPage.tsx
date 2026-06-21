import React from "react";
import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";

import { DiaryBookPdfPageCanvas } from "@/components/pdf/diaryBook/DiaryBookPdfPageCanvas";
import type { BoundDiaryEntry } from "@/components/journal/DiaryYearBoundPages";
import {
  DIARY_BOOK_ENTRY_V2_BODY,
  DIARY_BOOK_ENTRY_V2_COLORS,
  DIARY_BOOK_ENTRY_V2_COMMENT,
  DIARY_BOOK_ENTRY_V2_DATE,
  DIARY_BOOK_ENTRY_V2_FOOTER,
  DIARY_BOOK_ENTRY_V2_LABEL_LETTER_SPACING_EM,
  DIARY_BOOK_ENTRY_V2_MOOD,
  DIARY_BOOK_ENTRY_V2_NUMBERS,
  DIARY_BOOK_ENTRY_V2_PHOTO,
  DIARY_BOOK_ENTRY_V2_USE_COMPANION_OVERLAY,
  DIARY_BOOK_ENTRY_V2_USE_PHOTO_OVERLAY,
  getDiaryBookEntryCompanionBox,
  getDiaryBookEntryDateRowLeftPx,
  getDiaryBookEntryNumberLabelBox,
  getDiaryBookEntryNumberSlotBox,
  getDiaryBookEntryPhotoRotateOriginPx,
} from "@/lib/journal/diaryBookEntryPrintLayout";
import { diaryBookBodyDesignBackgroundPathForCompanion, diaryBookBodyDesignPhotoOverlayPathForCompanion } from "@/lib/journal/diaryBookAssets";
import { diaryBookEntryCompanionImagePath } from "@/lib/journal/diaryBookEntryAssets";
import { resolveDiaryBookPublicImagePath } from "@/lib/journal/diaryBookPrintPdfAssets";
import { diaryBookPdfFullBleedImageStyle, diaryBookPdfPx } from "@/lib/journal/diaryBookPrintPdfLayout";
import { getDiaryBookEntryV2BodyLayoutLines } from "@/lib/journal/diaryBookEntryBodyWrap";
import { getDiaryBookEntryV2BodyFontLayout } from "@/lib/journal/diaryBookEntryBodyFontLayout";
import {
  DIARY_BOOK_ENTRY_V2_BODY_FRAME_VARIANT,
  type DiaryBookEntryBodyFramePreviewVariant,
} from "@/lib/journal/diaryBookEntryBodyFramePreview";
import { resolveDiaryBookEntryV2CommentRenderLayout } from "@/lib/journal/diaryBookEntryCommentWrap";
import { DIARY_BOOK_ENTRY_V2_LABEL_FONT_FAMILY_PDF } from "@/lib/journal/diaryBookEntryLabelFont";
import { normalizeContentFontMode } from "@/lib/journal/contentFontMode";
import { getDiaryPreviewDateRowSegments } from "@/lib/journal/diaryPreviewFixedLayout";
import { getActivityMeta, getCompanionReadingHeading, normalizeCompanionType } from "@/lib/journal/meta";
import { moodOwlIconImagePath } from "@/lib/journal/moodAssets";
import { splitFixedWidthJapaneseLines } from "@/lib/pdf/splitFixedWidthJapaneseLines";

const px = (value: number, axis: "x" | "y" = "x") => diaryBookPdfPx(value, axis);

const styles = StyleSheet.create({
  centeredRow: {
    position: "absolute",
    left: 0,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    position: "absolute",
    fontFamily: DIARY_BOOK_ENTRY_V2_LABEL_FONT_FAMILY_PDF,
    fontWeight: 600,
    color: DIARY_BOOK_ENTRY_V2_COLORS.textMuted,
    textAlign: "center",
  },
  sectionHeader: {
    position: "absolute",
    fontFamily: DIARY_BOOK_ENTRY_V2_LABEL_FONT_FAMILY_PDF,
    fontWeight: 600,
    color: DIARY_BOOK_ENTRY_V2_COLORS.header,
    textAlign: "center",
  },
  decoImage: {
    position: "absolute",
    objectFit: "contain",
  },
  bodyBlock: {
    fontFamily: "NotoSansJP",
    color: DIARY_BOOK_ENTRY_V2_COLORS.text,
    textAlign: "left",
  },
  commentLine: {
    fontFamily: "NotoSansJP",
    color: DIARY_BOOK_ENTRY_V2_COLORS.text,
    textAlign: "left",
  },
  numberValue: {
    fontFamily: "NotoSansJP",
    fontWeight: 600,
    color: DIARY_BOOK_ENTRY_V2_COLORS.numberValue,
    textAlign: "center",
  },
  numberLabel: {
    position: "absolute",
    fontFamily: "NotoSansJP",
    fontWeight: 700,
    color: DIARY_BOOK_ENTRY_V2_COLORS.textMuted,
    textAlign: "center",
  },
  moodText: {
    fontFamily: "NotoSansJP",
    color: DIARY_BOOK_ENTRY_V2_COLORS.text,
  },
  photoClip: {
    position: "absolute",
    overflow: "hidden",
  },
  photoImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  companionImage: {
    position: "absolute",
    objectFit: "contain",
    objectPosition: "left bottom",
  },
  footer: {
    position: "absolute",
    left: 0,
    width: "100%",
    textAlign: "center",
    fontFamily: "LibreBaskerville",
    color: DIARY_BOOK_ENTRY_V2_FOOTER.color,
  },
});

function labelLetterSpacingPx(fontSizePx: number): number {
  return DIARY_BOOK_ENTRY_V2_LABEL_LETTER_SPACING_EM * px(fontSizePx, "x");
}

function resolveImage(webPath: string): string {
  return resolveDiaryBookPublicImagePath(webPath);
}

export function DiaryBookEntryPdfPage({
  entry,
  photoDataUri,
  bodyFramePreviewVariant: _bodyFramePreviewVariant = DIARY_BOOK_ENTRY_V2_BODY_FRAME_VARIANT,
  showBodyFramePreviewLabel: _showBodyFramePreviewLabel = false,
}: {
  entry: BoundDiaryEntry;
  photoDataUri?: string | null;
  /** @deprecated デザイン背景テンプレでは未使用 */
  bodyFramePreviewVariant?: DiaryBookEntryBodyFramePreviewVariant;
  /** @deprecated デザイン背景テンプレでは未使用 */
  showBodyFramePreviewLabel?: boolean;
}) {
  const previewDate = new Date(entry.createdAt);
  const contentFontMode = normalizeContentFontMode(entry.contentFontMode);
  const dateSegments = getDiaryPreviewDateRowSegments(previewDate).filter(
    (segment) => segment.key !== "label",
  );
  const dateFontSizePx = DIARY_BOOK_ENTRY_V2_DATE.fontSizePx;
  const dateRowLeftPx = getDiaryBookEntryDateRowLeftPx(dateSegments, dateFontSizePx);
  const bodyLines = entry.content.trim()
    ? getDiaryBookEntryV2BodyLayoutLines(entry.content, contentFontMode)
    : [];

  const numbers = entry.diaryNumbers ?? { today: "-", month: "-", year: "-" };
  const numberValuesByKey = {
    today: String(numbers.today),
    month: String(numbers.month),
    year: String(numbers.year),
  } as const;

  const activityLabel = getActivityMeta(entry.activity).label;
  const moodTextLines = splitFixedWidthJapaneseLines(
    activityLabel,
    DIARY_BOOK_ENTRY_V2_MOOD.textMaxCharsPerLine,
  );

  const commentHeading = getCompanionReadingHeading(normalizeCompanionType(entry.companionType));
  const owlComment =
    entry.generatedComment?.trim() ||
    `保存後に「${commentHeading}」がここに入ります。`;

  const commentInnerHeight = px(DIARY_BOOK_ENTRY_V2_COMMENT.contentHeightPx, "y");
  const commentLayout = resolveDiaryBookEntryV2CommentRenderLayout(owlComment);
  const commentFontSizePt =
    px(DIARY_BOOK_ENTRY_V2_COMMENT.contentFontSizePx, "x") * commentLayout.fontScale;

  const hasPhoto = entry.hasPhoto === true && Boolean(photoDataUri?.trim());
  const moodIconSrc = resolveImage(moodOwlIconImagePath(entry.mood));
  const backgroundSrc = resolveImage(
    diaryBookBodyDesignBackgroundPathForCompanion(entry.companionType),
  );
  const companionSrc = DIARY_BOOK_ENTRY_V2_USE_COMPANION_OVERLAY
    ? resolveImage(diaryBookEntryCompanionImagePath(entry.companionType))
    : null;
  const companionBox = getDiaryBookEntryCompanionBox(entry.companionType);
  const photoOverlaySrc = DIARY_BOOK_ENTRY_V2_USE_PHOTO_OVERLAY
    ? resolveImage(diaryBookBodyDesignPhotoOverlayPathForCompanion(entry.companionType))
    : null;

  const photo = DIARY_BOOK_ENTRY_V2_PHOTO;
  const numbersCfg = DIARY_BOOK_ENTRY_V2_NUMBERS;
  const moodCfg = DIARY_BOOK_ENTRY_V2_MOOD;
  const bodyCfg = DIARY_BOOK_ENTRY_V2_BODY;
  const commentCfg = DIARY_BOOK_ENTRY_V2_COMMENT;
  const bodyFontLayout = getDiaryBookEntryV2BodyFontLayout(contentFontMode);
  const bodyFontSizePt = px(bodyFontLayout.fontSizePx, "x");
  const bodyContentWidthPt = px(bodyCfg.contentWidthPx, "x");
  const bodyContentHeightPt = px(bodyCfg.contentHeightPx, "y");

  return (
    <DiaryBookPdfPageCanvas backgroundSrc={backgroundSrc}>
      {hasPhoto ? (
        <View
          wrap={false}
          style={[
            styles.photoClip,
            {
              left: px(photo.contentLeftPx, "x"),
              top: px(photo.contentTopPx, "y"),
              width: px(photo.contentSizePx, "x"),
              height: px(photo.contentSizePx, "y"),
              transform: `rotate(${photo.contentRotateDeg}deg)`,
            },
          ]}
        >
          <Image cache={false} src={photoDataUri!} style={styles.photoImage} />
        </View>
      ) : null}

      {DIARY_BOOK_ENTRY_V2_USE_PHOTO_OVERLAY && photoOverlaySrc ? (
        <Image cache={false} src={photoOverlaySrc} style={diaryBookPdfFullBleedImageStyle} />
      ) : null}

      <View
        wrap={false}
        style={{
          position: "absolute",
          left: px(dateRowLeftPx, "x"),
          top: px(DIARY_BOOK_ENTRY_V2_DATE.topPx, "y"),
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        {dateSegments.map((segment, index) => (
          <Text
            key={segment.key}
            wrap={false}
            style={{
              fontFamily: DIARY_BOOK_ENTRY_V2_LABEL_FONT_FAMILY_PDF,
              fontWeight: DIARY_BOOK_ENTRY_V2_DATE.fontWeight,
              fontSize: px(dateFontSizePx, "x"),
              color: DIARY_BOOK_ENTRY_V2_DATE.color,
              letterSpacing:
                DIARY_BOOK_ENTRY_V2_DATE.letterSpacingEm * px(dateFontSizePx, "x"),
              marginLeft: index === 0 ? 0 : px(DIARY_BOOK_ENTRY_V2_DATE.segmentGapPx, "x"),
            }}
          >
            {segment.text}
          </Text>
        ))}
      </View>

      <View
        wrap={false}
        style={{
          position: "absolute",
          left: px(photo.labelLeftPx, "x"),
          top: px(photo.labelTopPx, "y"),
          width: px(photo.labelWidthPx, "x"),
          height: px(photo.labelHeightPx, "y"),
          justifyContent: "center",
          alignItems: "center",
          transform: `rotate(${photo.contentRotateDeg}deg)`,
        }}
      >
        <Text
          wrap={false}
          style={[
            styles.label,
            {
              position: "relative",
              left: 0,
              top: 0,
              width: px(photo.labelWidthPx, "x"),
              fontSize: px(photo.labelFontSizePx, "x"),
              letterSpacing: labelLetterSpacingPx(photo.labelFontSizePx),
            },
          ]}
        >
          {photo.labelText}
        </Text>
      </View>

      <Text
        wrap={false}
        style={[
          styles.sectionHeader,
          {
            left: px(numbersCfg.headerLeftPx, "x"),
            top: px(numbersCfg.headerTopPx, "y"),
            width: px(numbersCfg.headerWidthPx, "x"),
            fontSize: px(numbersCfg.headerFontSizePx, "x"),
            letterSpacing: labelLetterSpacingPx(numbersCfg.headerFontSizePx),
          },
        ]}
      >
        {numbersCfg.headerText}
      </Text>

      {numbersCfg.labels.map((label, index) => {
        const slotBox = getDiaryBookEntryNumberSlotBox(index);
        const labelBox = getDiaryBookEntryNumberLabelBox(index);
        const valueKey = numbersCfg.keys[index];
        const offset = numbersCfg.valueOffsetPx;
        return (
          <React.Fragment key={label}>
            <View
              wrap={false}
              style={{
                position: "absolute",
                left: px(slotBox.leftPx + offset.x, "x"),
                top: px(slotBox.topPx + offset.y, "y"),
                width: px(slotBox.widthPx, "x"),
                height: px(slotBox.heightPx, "y"),
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                wrap={false}
                style={[
                  styles.numberValue,
                  {
                    fontSize: px(numbersCfg.valueFontSizePx, "x"),
                  },
                ]}
              >
                {numberValuesByKey[valueKey]}
              </Text>
            </View>
            <Text
              wrap={false}
              style={[
                styles.numberLabel,
                {
                  left: px(labelBox.leftPx, "x"),
                  top: px(labelBox.topPx, "y"),
                  width: px(labelBox.widthPx, "x"),
                  height: px(labelBox.heightPx, "y"),
                  fontSize: px(numbersCfg.labelFontSizePx, "x"),
                  letterSpacing: labelLetterSpacingPx(numbersCfg.labelFontSizePx),
                },
              ]}
            >
              {label}
            </Text>
          </React.Fragment>
        );
      })}

      <Text
        wrap={false}
        style={[
          styles.sectionHeader,
          {
            left: px(moodCfg.headerLeftPx, "x"),
            top: px(moodCfg.headerTopPx, "y"),
            width: px(moodCfg.headerWidthPx, "x"),
            fontSize: px(moodCfg.headerFontSizePx, "x"),
            letterSpacing: labelLetterSpacingPx(moodCfg.headerFontSizePx),
          },
        ]}
      >
        {moodCfg.headerText}
      </Text>

      <Image
        cache={false}
        src={moodIconSrc}
        style={[
          styles.decoImage,
          {
            left: px(moodCfg.iconLeftPx, "x"),
            top: px(moodCfg.iconTopPx, "y"),
            width: px(moodCfg.iconSizePx, "x"),
            height: px(moodCfg.iconSizePx, "x"),
          },
        ]}
      />

      <View
        wrap={false}
        style={{
          position: "absolute",
          left: px(moodCfg.textLeftPx, "x"),
          top: px(moodCfg.textTopPx, "y"),
          width: px(moodCfg.textWidthPx, "x"),
          height: px(moodCfg.textHeightPx, "y"),
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {moodTextLines.map((line, index) => (
          <Text
            key={`mood-line-${index}`}
            wrap={false}
            style={[
              styles.moodText,
              {
                fontSize: px(moodCfg.textFontSizePx, "x"),
                lineHeight: moodCfg.textLineHeight,
                fontWeight: moodCfg.textFontWeight,
                letterSpacing: moodCfg.textLetterSpacingEm * px(moodCfg.textFontSizePx, "x"),
              },
            ]}
          >
            {line.length > 0 ? line : " "}
          </Text>
        ))}
      </View>

      <Text
        wrap={false}
        style={[
          styles.label,
          {
            left: px(bodyCfg.labelLeftPx, "x"),
            top: px(bodyCfg.labelTopPx, "y"),
            width: px(bodyCfg.labelWidthPx, "x"),
            height: px(bodyCfg.labelHeightPx, "y"),
            fontSize: px(bodyCfg.labelFontSizePx, "x"),
            letterSpacing: labelLetterSpacingPx(bodyCfg.labelFontSizePx),
          },
        ]}
      >
        {bodyCfg.labelText}
      </Text>

      <View
        wrap={false}
        style={{
          position: "absolute",
          left: px(bodyCfg.contentLeftPx, "x"),
          top: px(bodyCfg.contentTopPx, "y"),
          width: bodyContentWidthPt,
          height: bodyContentHeightPt,
          overflow: "hidden",
        }}
      >
        <View wrap={false}>
          {bodyLines.map((line, index) => (
            <View
              key={`body-line-${index}`}
              wrap={false}
              style={{
                flexShrink: 0,
                minWidth: bodyFontSizePt * Math.max(line.length, 1),
              }}
            >
              <Text
                wrap={false}
                style={[
                  styles.bodyBlock,
                  {
                    fontSize: bodyFontSizePt,
                    lineHeight: bodyFontLayout.lineHeight,
                  },
                ]}
              >
                {line.length > 0 ? line : " "}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Text
        wrap={false}
        style={[
          styles.label,
          {
            left: px(commentCfg.labelLeftPx, "x"),
            top: px(commentCfg.labelTopPx, "y"),
            width: px(commentCfg.labelWidthPx, "x"),
            height: px(commentCfg.labelHeightPx, "y"),
            fontSize: px(commentCfg.labelFontSizePx, "x"),
            letterSpacing: labelLetterSpacingPx(commentCfg.labelFontSizePx),
          },
        ]}
      >
        {commentHeading}
      </Text>

      <View
        wrap={false}
        style={{
          position: "absolute",
          left: px(commentCfg.contentLeftPx, "x"),
          top: px(commentCfg.contentTopPx, "y"),
          width: px(
            commentCfg.contentWidthPx - commentCfg.contentPaddingRightPx,
            "x",
          ),
          height: commentInnerHeight,
          overflow: "hidden",
        }}
      >
        <View wrap={false}>
          {commentLayout.lines.map((line, index) => (
            <View key={`comment-line-${index}`} wrap={false} style={{ flexShrink: 0 }}>
              <Text
                wrap={false}
                style={[
                  styles.commentLine,
                  {
                    fontSize: commentFontSizePt,
                    lineHeight: commentLayout.lineHeight,
                  },
                ]}
              >
                {line.length > 0 ? line : " "}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {companionSrc ? (
        <Image
          cache={false}
          src={companionSrc}
          style={[
            styles.companionImage,
            {
              left: px(companionBox.leftPx, "x"),
              top: px(companionBox.topPx, "y"),
              width: px(companionBox.widthPx, "x"),
              height: px(companionBox.heightPx, "y"),
            },
          ]}
        />
      ) : null}

      {DIARY_BOOK_ENTRY_V2_FOOTER.showInDesignBackground ? (
        <Text
          wrap={false}
          style={[
            styles.footer,
            {
              top: px(DIARY_BOOK_ENTRY_V2_FOOTER.topPx, "y"),
              fontSize: px(DIARY_BOOK_ENTRY_V2_FOOTER.fontSizePx, "x"),
            },
          ]}
        >
          {DIARY_BOOK_ENTRY_V2_FOOTER.text}
        </Text>
      ) : null}
    </DiaryBookPdfPageCanvas>
  );
}
