import React from "react";
import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";

import { DiaryBookPdfPageCanvas } from "@/components/pdf/diaryBook/DiaryBookPdfPageCanvas";
import type { BoundDiaryEntry } from "@/components/journal/DiaryYearBoundPages";
import {
  DIARY_BOOK_ENTRY_DECO,
  DIARY_BOOK_ENTRY_NUMBER_BG,
  diaryBookEntryCompanionImagePath,
} from "@/lib/journal/diaryBookEntryAssets";
import {
  DIARY_BOOK_ENTRY_V2_BODY,
  DIARY_BOOK_ENTRY_V2_COLORS,
  DIARY_BOOK_ENTRY_V2_COMMENT,
  DIARY_BOOK_ENTRY_V2_DATE,
  DIARY_BOOK_ENTRY_V2_DESIGN,
  DIARY_BOOK_ENTRY_V2_FOOTER,
  DIARY_BOOK_ENTRY_V2_LABEL_LETTER_SPACING_EM,
  DIARY_BOOK_ENTRY_V2_MOOD,
  DIARY_BOOK_ENTRY_V2_NUMBERS,
  DIARY_BOOK_ENTRY_V2_PHOTO,
  estimateDiaryBookEntryDateRowWidthPx,
  estimateDiaryBookEntryBodyLabelWidthPx,
} from "@/lib/journal/diaryBookEntryPrintLayout";
import { resolveDiaryBookPublicImagePath } from "@/lib/journal/diaryBookPrintPdfAssets";
import { normalizeContentFontMode } from "@/lib/journal/contentFontMode";
import { diaryBookPdfPx } from "@/lib/journal/diaryBookPrintPdfLayout";
import { getDiaryBookEntryV2BodyLayoutLines } from "@/lib/journal/diaryBookEntryBodyWrap";
import { getDiaryBookEntryV2BodyFontLayout } from "@/lib/journal/diaryBookEntryBodyFontLayout";
import {
  DIARY_BOOK_ENTRY_BODY_FRAME_FILL_SUBTLE,
  DIARY_BOOK_ENTRY_V2_BODY_BRANCH_UNDER_TITLE,
  DIARY_BOOK_ENTRY_V2_BODY_FRAME_VARIANT,
  type DiaryBookEntryBodyFramePreviewVariant,
  diaryBookEntryBodyFramePreviewLabel,
} from "@/lib/journal/diaryBookEntryBodyFramePreview";
import { resolveDiaryBookEntryV2CommentRenderLayout } from "@/lib/journal/diaryBookEntryCommentWrap";
import { getDiaryPreviewDateRowSegments, getDiaryPreviewDateRowTextStyle } from "@/lib/journal/diaryPreviewFixedLayout";
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
    fontFamily: "NotoSansJP",
    fontWeight: 700,
    color: DIARY_BOOK_ENTRY_V2_COLORS.text,
  },
  sectionHeader: {
    position: "absolute",
    fontFamily: "NotoSansJP",
    fontWeight: 700,
    color: DIARY_BOOK_ENTRY_V2_COLORS.text,
    textAlign: "center",
  },
  decoImage: {
    position: "absolute",
    objectFit: "contain",
  },
  roundedBox: {
    position: "absolute",
    borderStyle: "solid",
    borderColor: DIARY_BOOK_ENTRY_V2_COLORS.border,
  },
  fillPanel: {
    position: "absolute",
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
    fontWeight: 400,
    color: DIARY_BOOK_ENTRY_V2_COLORS.text,
    textAlign: "center",
  },
  numberSlotIcon: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  numberLabel: {
    position: "absolute",
    fontFamily: "NotoSansJP",
    fontWeight: 700,
    color: DIARY_BOOK_ENTRY_V2_COLORS.text,
    textAlign: "center",
  },
  moodText: {
    position: "absolute",
    fontFamily: "NotoSansJP",
    color: DIARY_BOOK_ENTRY_V2_COLORS.text,
  },
  photoClip: {
    position: "absolute",
    overflow: "hidden",
    backgroundColor: DIARY_BOOK_ENTRY_V2_COLORS.photoPlaceholder,
  },
  photoImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
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

function numberSlotLeftPx(index: number): number {
  const { leftPx, widthPx, slotSizePx, slotGapPx } = DIARY_BOOK_ENTRY_V2_NUMBERS;
  const rowWidth = slotSizePx * 3 + slotGapPx * 2;
  const rowLeft = leftPx + (widthPx - rowWidth) / 2;
  return rowLeft + index * (slotSizePx + slotGapPx);
}

function numberSlotBgSizePx(key: "day" | "month" | "year"): number {
  return DIARY_BOOK_ENTRY_V2_NUMBERS.slotBgSizePxByKey[key];
}

function numberSlotValueBox(
  index: number,
): { leftPx: number; topPx: number; widthPx: number; heightPx: number } {
  const numbersCfg = DIARY_BOOK_ENTRY_V2_NUMBERS;
  const slotLeft = numberSlotLeftPx(index);
  const slotTop = numbersCfg.rowTopPx;
  const offset = numbersCfg.valueOffsetPx;
  return {
    leftPx: slotLeft + offset.x,
    topPx: slotTop + offset.y,
    widthPx: numbersCfg.slotSizePx,
    heightPx: numbersCfg.slotSizePx,
  };
}

function numberSlotBgBox(
  index: number,
  key: "day" | "month" | "year",
): { leftPx: number; topPx: number; sizePx: number } {
  const numbersCfg = DIARY_BOOK_ENTRY_V2_NUMBERS;
  const slotLeft = numberSlotLeftPx(index);
  const slotTop = numbersCfg.rowTopPx;
  const sizePx = numberSlotBgSizePx(key);
  const slotCenterX = slotLeft + numbersCfg.slotSizePx / 2;
  const slotCenterY = slotTop + numbersCfg.slotSizePx / 2;
  return {
    leftPx: slotCenterX - sizePx / 2,
    topPx: slotCenterY - sizePx / 2,
    sizePx,
  };
}

export function DiaryBookEntryPdfPage({
  entry,
  photoDataUri,
  bodyFramePreviewVariant = DIARY_BOOK_ENTRY_V2_BODY_FRAME_VARIANT,
  showBodyFramePreviewLabel = false,
}: {
  entry: BoundDiaryEntry;
  photoDataUri?: string | null;
  /** 比較プレビュー用。省略時は現状の線枠 */
  bodyFramePreviewVariant?: DiaryBookEntryBodyFramePreviewVariant;
  showBodyFramePreviewLabel?: boolean;
}) {
  const previewDate = new Date(entry.createdAt);
  const contentFontMode = normalizeContentFontMode(entry.contentFontMode);
  const dateSegments = getDiaryPreviewDateRowSegments(previewDate).filter(
    (segment) => segment.key !== "label",
  );
  const dateTextStyle = getDiaryPreviewDateRowTextStyle(contentFontMode);
  const dateFontSizePx = parseFloat(dateTextStyle.fontSize);
  const dateRowWidthPx = estimateDiaryBookEntryDateRowWidthPx(
    dateSegments,
    dateFontSizePx,
    DIARY_BOOK_ENTRY_V2_DATE.letterSpacingEm,
    DIARY_BOOK_ENTRY_V2_DATE.segmentGapPx,
  );
  const dateBranchWidthPx =
    dateRowWidthPx + DIARY_BOOK_ENTRY_V2_DATE.branchExtraWidthPx;
  const dateBranchHeightPx =
    dateBranchWidthPx / DIARY_BOOK_ENTRY_V2_DATE.branchAspectRatio;
  const bodyLines = entry.content.trim()
    ? getDiaryBookEntryV2BodyLayoutLines(entry.content, contentFontMode)
    : [];

  const numbers = entry.diaryNumbers ?? { today: "-", month: "-", year: "-" };
  const numberValuesByKey = {
    today: String(numbers.today),
    month: String(numbers.month),
    year: String(numbers.year),
  } as const;
  const numberBgKeys = ["day", "month", "year"] as const;
  const numberValueKeys = DIARY_BOOK_ENTRY_V2_NUMBERS.keys;

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
  const commentContentWidthPt = px(DIARY_BOOK_ENTRY_V2_COMMENT.contentWidthPx, "x");

  const hasPhoto = entry.hasPhoto === true && Boolean(photoDataUri?.trim());
  const companionSrc = resolveImage(diaryBookEntryCompanionImagePath(entry.companionType));
  const moodIconSrc = resolveImage(moodOwlIconImagePath(entry.mood));

  const photo = DIARY_BOOK_ENTRY_V2_PHOTO;
  const photoInnerSizePx = photo.photoInnerSizePx;
  const photoContentSizePx = photoInnerSizePx * photo.photoContentScale;
  const photoContentOffsetInInnerPx = (photoInnerSizePx - photoContentSizePx) / 2;
  const photoContentLeftPx =
    photo.leftPx + photo.photoInnerInsetLeftPx + photoContentOffsetInInnerPx;
  const photoContentTopPx =
    photo.topPx + photo.photoInnerInsetTopPx + photoContentOffsetInInnerPx;
  const numbersCfg = DIARY_BOOK_ENTRY_V2_NUMBERS;
  const moodCfg = DIARY_BOOK_ENTRY_V2_MOOD;
  const bodyCfg = DIARY_BOOK_ENTRY_V2_BODY;
  const commentCfg = DIARY_BOOK_ENTRY_V2_COMMENT;
  const bodyFontLayout = getDiaryBookEntryV2BodyFontLayout(contentFontMode);
  const bodyFontSizePt = px(bodyFontLayout.fontSizePx, "x");
  const bodyContentWidthPt = px(bodyCfg.contentWidthPx, "x");
  const bodyContentHeightPt = px(bodyCfg.contentHeightPx, "y");

  const companionLeft =
    DIARY_BOOK_ENTRY_V2_DESIGN.widthPx -
    commentCfg.companionRightPx -
    commentCfg.companionWidthPx;

  const frameVariant = bodyFramePreviewVariant;
  const showBodyFeather = frameVariant === "border";
  const showBodyPawprintAfterTitle = frameVariant === "none-pawprint";
  const bodyLabelFontSizePx = bodyCfg.labelFontSizePx;
  const bodyTitleWidthPx = estimateDiaryBookEntryBodyLabelWidthPx(
    bodyCfg.labelText,
    bodyLabelFontSizePx,
    DIARY_BOOK_ENTRY_V2_LABEL_LETTER_SPACING_EM,
  );
  const pawprintCfg = bodyCfg.pawprintAfterTitle;
  const bodyPawprintLeftPx =
    bodyCfg.labelLeftPx + bodyTitleWidthPx + pawprintCfg.gapAfterTitlePx;
  const bodyPawprintTopPx =
    bodyCfg.labelTopPx +
    (bodyLabelFontSizePx - pawprintCfg.heightPx) / 2 +
    pawprintCfg.topNudgePx;

  return (
    <DiaryBookPdfPageCanvas>
      <View wrap={false} style={[styles.centeredRow, { top: px(DIARY_BOOK_ENTRY_V2_DATE.topPx, "y") }]}>
        {dateSegments.map((segment, index) => (
          <Text
            key={segment.key}
            wrap={false}
            style={{
              fontFamily: "NotoSansJP",
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

      <Image
        cache={false}
        src={resolveImage(DIARY_BOOK_ENTRY_DECO.branch)}
        style={[
          styles.decoImage,
          {
            left: px(
              (DIARY_BOOK_ENTRY_V2_DESIGN.widthPx - dateBranchWidthPx) / 2,
              "x",
            ),
            top: px(DIARY_BOOK_ENTRY_V2_DATE.branchTopPx, "y"),
            width: px(dateBranchWidthPx, "x"),
            height: px(dateBranchHeightPx, "y"),
          },
        ]}
      />

      <Text
        wrap={false}
        style={[
          styles.sectionHeader,
          {
            left: px(photo.leftPx, "x"),
            top: px(photo.labelTopPx, "y"),
            width: px(photo.sizePx, "x"),
            fontSize: px(photo.labelFontSizePx, "x"),
            letterSpacing: labelLetterSpacingPx(photo.labelFontSizePx),
          },
        ]}
      >
        {photo.labelText}
      </Text>

      {hasPhoto ? (
        <View
          wrap={false}
          style={[
            styles.photoClip,
            {
              left: px(photoContentLeftPx, "x"),
              top: px(photoContentTopPx, "y"),
              width: px(photoContentSizePx, "x"),
              height: px(photoContentSizePx, "y"),
            },
          ]}
        >
          <Image cache={false} src={photoDataUri!} style={styles.photoImage} />
        </View>
      ) : null}

      {!hasPhoto ? (
        <Image
          cache={false}
          src={resolveImage(DIARY_BOOK_ENTRY_DECO.photoCameraIcon)}
          style={[
            styles.decoImage,
            {
              left: px(
                photo.leftPx + photo.sizePx * (0.5 - photo.cameraIconScale / 2),
                "x",
              ),
              top: px(
                photo.topPx + photo.sizePx * (0.5 - photo.cameraIconScale / 2),
                "y",
              ),
              width: px(photo.sizePx * photo.cameraIconScale, "x"),
              height: px(photo.sizePx * photo.cameraIconScale, "y"),
            },
          ]}
        />
      ) : null}

      <Image
        cache={false}
        src={resolveImage(DIARY_BOOK_ENTRY_DECO.photoLeaves)}
        style={[
          styles.decoImage,
          {
            left: px(photo.leftPx, "x"),
            top: px(photo.topPx, "y"),
            width: px(photo.sizePx, "x"),
            height: px(photo.sizePx, "y"),
          },
        ]}
      />

      <Image
        cache={false}
        src={resolveImage(DIARY_BOOK_ENTRY_DECO.branch)}
        style={[
          styles.decoImage,
          {
            left: px(numbersCfg.leftPx + (numbersCfg.widthPx - numbersCfg.branchWidthPx) / 2, "x"),
            top: px(numbersCfg.branchTopPx, "y"),
            width: px(numbersCfg.branchWidthPx, "x"),
            height: px(numbersCfg.branchHeightPx, "y"),
          },
        ]}
      />

      <Text
        wrap={false}
        style={[
          styles.sectionHeader,
          {
            left: px(numbersCfg.leftPx, "x"),
            top: px(numbersCfg.topPx, "y"),
            width: px(numbersCfg.widthPx, "x"),
            fontSize: px(numbersCfg.headerFontSizePx, "x"),
            letterSpacing: labelLetterSpacingPx(numbersCfg.headerFontSizePx),
          },
        ]}
      >
        {numbersCfg.headerText}
      </Text>

      {numberBgKeys.map((key, index) => {
        const slotTop = numbersCfg.rowTopPx;
        const bgBox = numberSlotBgBox(index, key);
        const valueBox = numberSlotValueBox(index);
        const valueKey = numberValueKeys[index];
        return (
          <React.Fragment key={key}>
            <View
              wrap={false}
              style={{
                position: "absolute",
                left: px(bgBox.leftPx, "x"),
                top: px(bgBox.topPx, "y"),
                width: px(bgBox.sizePx, "x"),
                height: px(bgBox.sizePx, "y"),
              }}
            >
              <Image
                cache={false}
                src={resolveImage(DIARY_BOOK_ENTRY_NUMBER_BG[key])}
                style={styles.numberSlotIcon}
              />
            </View>
            <View
              wrap={false}
              style={{
                position: "absolute",
                left: px(valueBox.leftPx, "x"),
                top: px(valueBox.topPx, "y"),
                width: px(valueBox.widthPx, "x"),
                height: px(valueBox.heightPx, "y"),
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
                  left: px(numberSlotLeftPx(index), "x"),
                  top: px(slotTop + numbersCfg.slotSizePx + 4, "y"),
                  width: px(numbersCfg.slotSizePx, "x"),
                  fontSize: px(numbersCfg.labelFontSizePx, "x"),
                  letterSpacing: labelLetterSpacingPx(numbersCfg.labelFontSizePx),
                },
              ]}
            >
              {numbersCfg.labels[index]}
            </Text>
          </React.Fragment>
        );
      })}

      <Image
        cache={false}
        src={resolveImage(DIARY_BOOK_ENTRY_DECO.branch02)}
        style={[
          styles.decoImage,
          {
            left: px(moodCfg.leftPx + (moodCfg.widthPx - numbersCfg.branchWidthPx) / 2, "x"),
            top: px(moodCfg.branchTopPx, "y"),
            width: px(numbersCfg.branchWidthPx, "x"),
            height: px(numbersCfg.branchHeightPx, "y"),
          },
        ]}
      />

      <Text
        wrap={false}
        style={[
          styles.sectionHeader,
          {
            left: px(moodCfg.leftPx, "x"),
            top: px(moodCfg.topPx, "y"),
            width: px(moodCfg.widthPx, "x"),
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
                letterSpacing: moodCfg.textLetterSpacingEm * px(moodCfg.textFontSizePx, "x"),
              },
            ]}
          >
            {line.length > 0 ? line : " "}
          </Text>
        ))}
      </View>

      {showBodyFeather ? (
        <Image
          cache={false}
          src={resolveImage(DIARY_BOOK_ENTRY_DECO.feather)}
          style={[
            styles.decoImage,
            {
              left: px(bodyCfg.featherLeftPx, "x"),
              top: px(bodyCfg.featherTopPx, "y"),
              width: px(bodyCfg.featherSizePx, "x"),
              height: px(bodyCfg.featherSizePx, "y"),
            },
          ]}
        />
      ) : null}

      <Text
        wrap={false}
        style={[
          styles.label,
          {
            left: px(bodyCfg.labelLeftPx, "x"),
            top: px(bodyCfg.labelTopPx, "y"),
            fontSize: px(bodyCfg.labelFontSizePx, "x"),
            letterSpacing: labelLetterSpacingPx(bodyCfg.labelFontSizePx),
          },
        ]}
      >
        {bodyCfg.labelText}
      </Text>

      {showBodyPawprintAfterTitle ? (
        <Image
          cache={false}
          src={resolveImage(DIARY_BOOK_ENTRY_DECO.bodyPawprintAfterTitle)}
          style={[
            styles.decoImage,
            {
              left: px(bodyPawprintLeftPx, "x"),
              top: px(bodyPawprintTopPx, "y"),
              width: px(pawprintCfg.widthPx, "x"),
              height: px(pawprintCfg.heightPx, "y"),
            },
          ]}
        />
      ) : null}

      {showBodyFramePreviewLabel ? (
        <Text
          wrap={false}
          style={[
            styles.label,
            {
              left: px(48, "x"),
              top: px(12, "y"),
              fontSize: px(10, "x"),
              color: DIARY_BOOK_ENTRY_V2_COLORS.textMuted,
            },
          ]}
        >
          {diaryBookEntryBodyFramePreviewLabel(frameVariant)}
        </Text>
      ) : null}

      {frameVariant === "branch" ? (
        <Image
          cache={false}
          src={resolveImage(DIARY_BOOK_ENTRY_DECO.branch02)}
          style={[
            styles.decoImage,
            {
              left: px(DIARY_BOOK_ENTRY_V2_BODY_BRANCH_UNDER_TITLE.leftPx, "x"),
              top: px(DIARY_BOOK_ENTRY_V2_BODY_BRANCH_UNDER_TITLE.topPx, "y"),
              width: px(DIARY_BOOK_ENTRY_V2_BODY_BRANCH_UNDER_TITLE.widthPx, "x"),
              height: px(DIARY_BOOK_ENTRY_V2_BODY_BRANCH_UNDER_TITLE.heightPx, "y"),
            },
          ]}
        />
      ) : null}

      {frameVariant === "border" ? (
        <View
          wrap={false}
          style={[
            styles.roundedBox,
            {
              left: px(bodyCfg.boxLeftPx, "x"),
              top: px(bodyCfg.boxTopPx, "y"),
              width: px(bodyCfg.boxWidthPx, "x"),
              height: px(bodyCfg.boxHeightPx, "y"),
              borderRadius: px(bodyCfg.boxBorderRadiusPx, "x"),
              borderWidth: px(bodyCfg.boxBorderWidthPx, "x"),
            },
          ]}
        />
      ) : null}

      {frameVariant === "fill" || frameVariant === "fill-subtle" ? (
        <View
          wrap={false}
          style={[
            styles.fillPanel,
            {
              left: px(bodyCfg.boxLeftPx, "x"),
              top: px(bodyCfg.boxTopPx, "y"),
              width: px(bodyCfg.boxWidthPx, "x"),
              height: px(bodyCfg.boxHeightPx, "y"),
              borderRadius: px(bodyCfg.boxBorderRadiusPx, "x"),
              backgroundColor:
                frameVariant === "fill"
                  ? DIARY_BOOK_ENTRY_V2_COLORS.commentFill
                  : DIARY_BOOK_ENTRY_BODY_FRAME_FILL_SUBTLE,
            },
          ]}
        />
      ) : null}

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

      <View
        wrap={false}
        style={[
          styles.fillPanel,
          {
            left: px(commentCfg.panelLeftPx, "x"),
            top: px(commentCfg.panelTopPx, "y"),
            width: px(commentCfg.panelWidthPx, "x"),
            height: px(commentCfg.panelHeightPx, "y"),
            borderRadius: px(commentCfg.panelBorderRadiusPx, "x"),
            backgroundColor: commentCfg.panelFill,
          },
        ]}
      />

      <Text
        wrap={false}
        style={[
          styles.label,
          {
            left: px(commentCfg.labelLeftPx, "x"),
            top: px(commentCfg.labelTopPx, "y"),
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
          width: commentContentWidthPt,
          height: commentInnerHeight,
          overflow: "hidden",
        }}
      >
        <View wrap={false}>
          {commentLayout.lines.map((line, index) => (
            <View
              key={`comment-line-${index}`}
              wrap={false}
              style={{
                flexShrink: 0,
                minWidth: commentFontSizePt * Math.max(line.length, 1),
              }}
            >
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

      <Image
        cache={false}
        src={companionSrc}
        style={[
          styles.decoImage,
          {
            left: px(companionLeft, "x"),
            top: px(commentCfg.companionTopPx, "y"),
            width: px(commentCfg.companionWidthPx, "x"),
            height: px(commentCfg.companionHeightPx, "y"),
          },
        ]}
      />

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
    </DiaryBookPdfPageCanvas>
  );
}
