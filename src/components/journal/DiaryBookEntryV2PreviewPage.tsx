"use client";

import { useEffect, type CSSProperties } from "react";

import {
  DIARY_BOOK_ENTRY_DECO,
  DIARY_BOOK_ENTRY_NUMBER_BG,
  diaryBookEntryCompanionImagePath,
} from "@/lib/journal/diaryBookEntryAssets";
import {
  getDiaryBookEntryV2BodyLayoutLines,
  getDiaryBookEntryV2BodyLayoutLinesAll,
} from "@/lib/journal/diaryBookEntryBodyWrap";
import { getDiaryBookEntryV2BodyFontLayout } from "@/lib/journal/diaryBookEntryBodyFontLayout";
import { resolveDiaryBookEntryV2CommentRenderLayout } from "@/lib/journal/diaryBookEntryCommentWrap";
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
import { diaryBookPhotoMemoryLoadingImagePath } from "@/lib/journal/diaryBookAssets";
import { DIARY_PREVIEW_BODY_FONT_FAMILY } from "@/lib/journal/diaryPreviewBodyFont";
import {
  DIARY_PREVIEW_BODY_LINE_BASE_STYLE,
  DIARY_PREVIEW_BODY_LINES_CONTAINER_STYLE,
  DIARY_PREVIEW_COMMENT_LINE_BASE_STYLE,
  getDiaryPreviewBodyLineStyle,
} from "@/lib/journal/diaryPreviewBodyLineDisplay";
import {
  countBodyLayoutLinesBeyondBindingPreview,
  getDiaryBodyLineLimit,
  isDiaryBodyOverLineLimit,
} from "@/lib/journal/diaryPreviewBodyLineLimits";
import {
  getDiaryPreviewDateRowSegments,
  getDiaryPreviewDateRowTextStyle,
} from "@/lib/journal/diaryPreviewFixedLayout";
import { normalizeContentFontMode } from "@/lib/journal/contentFontMode";
import { JOURNAL_OWL_COMMENT_KANTEI_REQUIRED_MESSAGE } from "@/lib/journal/kanteiCommentCopy";
import { getActivityMeta, getCompanionReadingHeading, normalizeCompanionType } from "@/lib/journal/meta";
import { moodOwlIconImagePath } from "@/lib/journal/moodAssets";
import { splitFixedWidthJapaneseLines } from "@/lib/pdf/splitFixedWidthJapaneseLines";

export type DiaryBookEntryV2PreviewPageProps = {
  companionType?: string | null;
  mood: string;
  activity: string;
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
    calmness?: number | string;
  };
  contentFontMode?: string | null;
  /** false のとき未鑑定プロフィール向け案内を表示 */
  kanteiOrderExists?: boolean;
  /** ?bodyLinesDebug=1 — 行配列確認・行ごと背景（本文のみ） */
  bodyLinesDebug?: boolean;
};

function absBox(
  leftPx: number,
  topPx: number,
  widthPx?: number,
  heightPx?: number,
): CSSProperties {
  return {
    position: "absolute",
    left: `${leftPx}px`,
    top: `${topPx}px`,
    ...(widthPx != null ? { width: `${widthPx}px` } : {}),
    ...(heightPx != null ? { height: `${heightPx}px` } : {}),
  };
}

function labelLetterSpacingPx(fontSizePx: number): string {
  return `${DIARY_BOOK_ENTRY_V2_LABEL_LETTER_SPACING_EM * fontSizePx}px`;
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

function numberSlotBgBox(index: number, key: "day" | "month" | "year") {
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

function numberSlotValueBox(index: number) {
  const numbersCfg = DIARY_BOOK_ENTRY_V2_NUMBERS;
  const slotLeft = numberSlotLeftPx(index);
  const offset = numbersCfg.valueOffsetPx;
  return {
    leftPx: slotLeft + offset.x,
    topPx: numbersCfg.rowTopPx + offset.y,
    widthPx: numbersCfg.slotSizePx,
    heightPx: numbersCfg.slotSizePx,
  };
}

function EntryTextLines({
  lines,
  widthPx,
  heightPx,
  fontSizePx,
  lineHeight,
  letterSpacing,
  lineBaseStyle,
}: {
  lines: string[];
  widthPx: number;
  heightPx?: number;
  fontSizePx: number;
  lineHeight: number;
  letterSpacing?: string;
  lineBaseStyle: CSSProperties;
}) {
  const lineBoxPx = fontSizePx * lineHeight;
  return (
    <div
      className="overflow-hidden"
      style={{
        ...absBox(0, 0, widthPx, heightPx),
        fontFamily: DIARY_PREVIEW_BODY_FONT_FAMILY,
        color: DIARY_BOOK_ENTRY_V2_COLORS.text,
      }}
    >
      {lines.map((line, index) => (
        <div
          key={`line-${index}`}
          style={{
            ...lineBaseStyle,
            fontSize: `${fontSizePx}px`,
            lineHeight,
            letterSpacing,
            height: `${lineBoxPx}px`,
            minHeight: `${lineBoxPx}px`,
            maxHeight: `${lineBoxPx}px`,
          }}
        >
          {line.length > 0 ? line : "\u00a0"}
        </div>
      ))}
    </div>
  );
}

/**
 * 日記ブック本文ページ v2（724×1024）。
 * DiaryBookEntryPdfPage と同一レイアウト・改行ルール（本棚プレビュー用）。
 */
export function DiaryBookEntryV2PreviewPage({
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
  bodyLinesDebug = false,
}: DiaryBookEntryV2PreviewPageProps) {
  const contentFontMode = normalizeContentFontMode(contentFontModeProp);
  const trimmedBody = content.trim();
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
  const dateBranchWidthPx = dateRowWidthPx + DIARY_BOOK_ENTRY_V2_DATE.branchExtraWidthPx;
  const dateBranchHeightPx = dateBranchWidthPx / DIARY_BOOK_ENTRY_V2_DATE.branchAspectRatio;

  const { maxLines: bodyMaxLines } = getDiaryBodyLineLimit(contentFontMode);
  const allBodyLayoutLines = trimmedBody
    ? getDiaryBookEntryV2BodyLayoutLinesAll(content, contentFontMode)
    : [];
  const bindingBodyOverflow = trimmedBody
    ? isDiaryBodyOverLineLimit(trimmedBody, contentFontMode)
    : false;
  const bodyLines = trimmedBody
    ? getDiaryBookEntryV2BodyLayoutLines(content, contentFontMode)
    : [];
  const hiddenLineCount = trimmedBody
    ? countBodyLayoutLinesBeyondBindingPreview(trimmedBody, contentFontMode)
    : 0;

  useEffect(() => {
    if (!bodyLinesDebug || !trimmedBody) return;
    console.log("[diary-book-entry-v2-preview body lines]", {
      contentFontMode,
      bodyMaxLines,
      totalLineCount: allBodyLayoutLines.length,
      displayedLineCount: bodyLines.length,
      hiddenLineCount,
      bindingBodyOverflow,
      allLines: allBodyLayoutLines,
    });
  }, [
    bodyLinesDebug,
    trimmedBody,
    contentFontMode,
    bodyLines,
    allBodyLayoutLines,
    bodyMaxLines,
    hiddenLineCount,
    bindingBodyOverflow,
  ]);

  const numbers = diaryNumbers ?? { today: "-", month: "-", year: "-" };
  const numberValuesByKey = {
    today: String(numbers.today),
    month: String(numbers.month),
    year: String(numbers.year),
  } as const;

  const activityLabel = getActivityMeta(activity).label;
  const moodTextLines = splitFixedWidthJapaneseLines(
    activityLabel,
    DIARY_BOOK_ENTRY_V2_MOOD.textMaxCharsPerLine,
  );

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
  const bodyTitleWidthPx = estimateDiaryBookEntryBodyLabelWidthPx(
    bodyCfg.labelText,
    bodyCfg.labelFontSizePx,
    DIARY_BOOK_ENTRY_V2_LABEL_LETTER_SPACING_EM,
  );
  const pawprintCfg = bodyCfg.pawprintAfterTitle;
  const bodyPawprintLeftPx =
    bodyCfg.labelLeftPx + bodyTitleWidthPx + pawprintCfg.gapAfterTitlePx;
  const bodyPawprintTopPx =
    bodyCfg.labelTopPx +
    (bodyCfg.labelFontSizePx - pawprintCfg.heightPx) / 2 +
    pawprintCfg.topNudgePx;

  const companionLeft =
    DIARY_BOOK_ENTRY_V2_DESIGN.widthPx -
    commentCfg.companionRightPx -
    commentCfg.companionWidthPx;

  const commentFontSizePx = commentCfg.contentFontSizePx * commentLayout.fontScale;

  return (
    <div
      className="relative bg-white"
      style={{
        width: `${DIARY_BOOK_ENTRY_V2_DESIGN.widthPx}px`,
        height: `${DIARY_BOOK_ENTRY_V2_DESIGN.heightPx}px`,
      }}
    >
      <div
        className="absolute left-0 flex w-full items-center justify-center"
        style={{ top: `${DIARY_BOOK_ENTRY_V2_DATE.topPx}px` }}
      >
        {dateSegments.map((segment, index) => (
          <span
            key={segment.key}
            style={{
              fontWeight: DIARY_BOOK_ENTRY_V2_DATE.fontWeight,
              fontSize: `${dateFontSizePx}px`,
              color: DIARY_BOOK_ENTRY_V2_DATE.color,
              letterSpacing: `${DIARY_BOOK_ENTRY_V2_DATE.letterSpacingEm * dateFontSizePx}px`,
              marginLeft: index === 0 ? 0 : `${DIARY_BOOK_ENTRY_V2_DATE.segmentGapPx}px`,
            }}
          >
            {segment.text}
          </span>
        ))}
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        src={DIARY_BOOK_ENTRY_DECO.branch}
        className="absolute object-contain"
        style={{
          ...absBox(
            (DIARY_BOOK_ENTRY_V2_DESIGN.widthPx - dateBranchWidthPx) / 2,
            DIARY_BOOK_ENTRY_V2_DATE.branchTopPx,
            dateBranchWidthPx,
            dateBranchHeightPx,
          ),
        }}
      />

      <div
        className="absolute text-center font-bold"
        style={{
          ...absBox(photo.leftPx, photo.labelTopPx, photo.sizePx),
          fontSize: `${photo.labelFontSizePx}px`,
          letterSpacing: labelLetterSpacingPx(photo.labelFontSizePx),
          color: DIARY_BOOK_ENTRY_V2_COLORS.text,
        }}
      >
        {photo.labelText}
      </div>

      {hasPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          src={photoDisplaySrc}
          className="absolute object-cover"
          style={absBox(photoContentLeftPx, photoContentTopPx, photoContentSizePx, photoContentSizePx)}
        />
      ) : null}

      {showPhotoLoading ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          src={diaryBookPhotoMemoryLoadingImagePath()}
          className="absolute object-contain opacity-80"
          style={absBox(photoContentLeftPx, photoContentTopPx, photoContentSizePx, photoContentSizePx)}
        />
      ) : null}

      {!hasPhoto && !showPhotoLoading ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          src={DIARY_BOOK_ENTRY_DECO.photoCameraIcon}
          className="absolute object-contain"
          style={absBox(
            photo.leftPx + photo.sizePx * (0.5 - photo.cameraIconScale / 2),
            photo.topPx + photo.sizePx * (0.5 - photo.cameraIconScale / 2),
            photo.sizePx * photo.cameraIconScale,
            photo.sizePx * photo.cameraIconScale,
          )}
        />
      ) : null}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        src={DIARY_BOOK_ENTRY_DECO.photoLeaves}
        className="absolute object-contain"
        style={absBox(photo.leftPx, photo.topPx, photo.sizePx, photo.sizePx)}
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        src={DIARY_BOOK_ENTRY_DECO.branch}
        className="absolute object-contain"
        style={absBox(
          numbersCfg.leftPx + (numbersCfg.widthPx - numbersCfg.branchWidthPx) / 2,
          numbersCfg.branchTopPx,
          numbersCfg.branchWidthPx,
          numbersCfg.branchHeightPx,
        )}
      />

      <div
        className="absolute text-center font-bold"
        style={{
          ...absBox(numbersCfg.leftPx, numbersCfg.topPx, numbersCfg.widthPx),
          fontSize: `${numbersCfg.headerFontSizePx}px`,
          letterSpacing: labelLetterSpacingPx(numbersCfg.headerFontSizePx),
          color: DIARY_BOOK_ENTRY_V2_COLORS.text,
        }}
      >
        {numbersCfg.headerText}
      </div>

      {(["day", "month", "year"] as const).map((key, index) => {
        const bgBox = numberSlotBgBox(index, key);
        const valueBox = numberSlotValueBox(index);
        const valueKey = DIARY_BOOK_ENTRY_V2_NUMBERS.keys[index];
        return (
          <div key={key}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              src={DIARY_BOOK_ENTRY_NUMBER_BG[key]}
              className="absolute object-contain"
              style={absBox(bgBox.leftPx, bgBox.topPx, bgBox.sizePx, bgBox.sizePx)}
            />
            <div
              className="absolute flex items-center justify-center"
              style={absBox(valueBox.leftPx, valueBox.topPx, valueBox.widthPx, valueBox.heightPx)}
            >
              <span
                style={{
                  fontFamily: DIARY_PREVIEW_BODY_FONT_FAMILY,
                  fontSize: `${numbersCfg.valueFontSizePx}px`,
                  color: DIARY_BOOK_ENTRY_V2_COLORS.text,
                }}
              >
                {numberValuesByKey[valueKey]}
              </span>
            </div>
            <div
              className="absolute text-center font-bold"
              style={{
                ...absBox(
                  numberSlotLeftPx(index),
                  numbersCfg.rowTopPx + numbersCfg.slotSizePx + 4,
                  numbersCfg.slotSizePx,
                ),
                fontSize: `${numbersCfg.labelFontSizePx}px`,
                letterSpacing: labelLetterSpacingPx(numbersCfg.labelFontSizePx),
                color: DIARY_BOOK_ENTRY_V2_COLORS.text,
              }}
            >
              {numbersCfg.labels[index]}
            </div>
          </div>
        );
      })}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        src={DIARY_BOOK_ENTRY_DECO.branch02}
        className="absolute object-contain"
        style={absBox(
          moodCfg.leftPx + (moodCfg.widthPx - numbersCfg.branchWidthPx) / 2,
          moodCfg.branchTopPx,
          numbersCfg.branchWidthPx,
          numbersCfg.branchHeightPx,
        )}
      />

      <div
        className="absolute text-center font-bold"
        style={{
          ...absBox(moodCfg.leftPx, moodCfg.topPx, moodCfg.widthPx),
          fontSize: `${moodCfg.headerFontSizePx}px`,
          letterSpacing: labelLetterSpacingPx(moodCfg.headerFontSizePx),
          color: DIARY_BOOK_ENTRY_V2_COLORS.text,
        }}
      >
        {moodCfg.headerText}
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        src={moodOwlIconImagePath(mood)}
        className="absolute object-contain"
        style={absBox(moodCfg.iconLeftPx, moodCfg.iconTopPx, moodCfg.iconSizePx, moodCfg.iconSizePx)}
      />

      <div style={absBox(moodCfg.textLeftPx, moodCfg.textTopPx, moodCfg.textWidthPx)}>
        <EntryTextLines
          lines={moodTextLines}
          widthPx={moodCfg.textWidthPx}
          fontSizePx={moodCfg.textFontSizePx}
          lineHeight={moodCfg.textLineHeight}
          letterSpacing={labelLetterSpacingPx(moodCfg.textFontSizePx)}
          lineBaseStyle={DIARY_PREVIEW_BODY_LINE_BASE_STYLE}
        />
      </div>

      <div
        className="absolute font-bold"
        style={{
          ...absBox(bodyCfg.labelLeftPx, bodyCfg.labelTopPx),
          fontSize: `${bodyCfg.labelFontSizePx}px`,
          letterSpacing: labelLetterSpacingPx(bodyCfg.labelFontSizePx),
          color: DIARY_BOOK_ENTRY_V2_COLORS.text,
        }}
      >
        {bodyCfg.labelText}
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        src={DIARY_BOOK_ENTRY_DECO.bodyPawprintAfterTitle}
        className="absolute object-contain"
        style={absBox(
          bodyPawprintLeftPx,
          bodyPawprintTopPx,
          pawprintCfg.widthPx,
          pawprintCfg.heightPx,
        )}
      />

      <div
        className="absolute overflow-hidden"
        style={absBox(
          bodyCfg.contentLeftPx,
          bodyCfg.contentTopPx,
          bodyCfg.contentWidthPx,
          bodyCfg.contentHeightPx,
        )}
      >
        {bodyLinesDebug ? (
          <div
            className="overflow-hidden"
            style={{
              ...absBox(0, 0, bodyCfg.contentWidthPx, bodyCfg.contentHeightPx),
              ...DIARY_PREVIEW_BODY_LINES_CONTAINER_STYLE,
              fontFamily: DIARY_PREVIEW_BODY_FONT_FAMILY,
              color: DIARY_BOOK_ENTRY_V2_COLORS.text,
            }}
          >
            <div
              data-body-layout-line-count={bodyLines.length}
              data-body-layout-line-max={bodyMaxLines}
              data-body-lines-hidden={hiddenLineCount}
              data-body-lines-debug="1"
            >
              {bodyLines.map((line, index) => (
                <div
                  key={`body-line-${index}`}
                  role="presentation"
                  data-body-line-index={index + 1}
                  data-body-line-chars={line.length}
                  data-body-line-in-binding={index < bodyMaxLines ? "1" : "0"}
                  style={getDiaryPreviewBodyLineStyle(
                    {
                      fontSize: `${bodyFontLayout.fontSizePx}px`,
                      lineHeight: String(bodyFontLayout.lineHeight),
                    },
                    { debugVisual: true, lineIndex: index },
                  )}
                >
                  {line.length > 0 ? line : "\u00a0"}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EntryTextLines
            lines={bodyLines}
            widthPx={bodyCfg.contentWidthPx}
            heightPx={bodyCfg.contentHeightPx}
            fontSizePx={bodyFontLayout.fontSizePx}
            lineHeight={bodyFontLayout.lineHeight}
            lineBaseStyle={DIARY_PREVIEW_BODY_LINE_BASE_STYLE}
          />
        )}
      </div>

      <div
        className="absolute rounded-[10px]"
        style={{
          ...absBox(
            commentCfg.panelLeftPx,
            commentCfg.panelTopPx,
            commentCfg.panelWidthPx,
            commentCfg.panelHeightPx,
          ),
          backgroundColor: commentCfg.panelFill,
        }}
      />

      <div
        className="absolute font-bold"
        style={{
          ...absBox(commentCfg.labelLeftPx, commentCfg.labelTopPx),
          fontSize: `${commentCfg.labelFontSizePx}px`,
          letterSpacing: labelLetterSpacingPx(commentCfg.labelFontSizePx),
          color: DIARY_BOOK_ENTRY_V2_COLORS.text,
        }}
      >
        {commentCfg.labelText}
      </div>

      <div
        className="absolute overflow-hidden"
        style={absBox(
          commentCfg.contentLeftPx,
          commentCfg.contentTopPx,
          commentCfg.contentWidthPx,
          commentCfg.contentHeightPx,
        )}
      >
        <EntryTextLines
          lines={commentLayout.lines}
          widthPx={commentCfg.contentWidthPx}
          heightPx={commentCfg.contentHeightPx}
          fontSizePx={commentFontSizePx}
          lineHeight={commentLayout.lineHeight}
          lineBaseStyle={DIARY_PREVIEW_COMMENT_LINE_BASE_STYLE}
        />
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        src={diaryBookEntryCompanionImagePath(companionType ?? "owl")}
        className="absolute object-contain object-left object-bottom"
        style={absBox(
          companionLeft,
          commentCfg.companionTopPx,
          commentCfg.companionWidthPx,
          commentCfg.companionHeightPx,
        )}
      />

      <div
        className="absolute w-full text-center"
        style={{
          top: `${DIARY_BOOK_ENTRY_V2_FOOTER.topPx}px`,
          fontSize: `${DIARY_BOOK_ENTRY_V2_FOOTER.fontSizePx}px`,
          color: DIARY_BOOK_ENTRY_V2_FOOTER.color,
          fontFamily: "Libre Baskerville, serif",
        }}
      >
        {DIARY_BOOK_ENTRY_V2_FOOTER.text}
      </div>
    </div>
  );
}
