"use client";

import { useEffect, type CSSProperties } from "react";

import {
  getDiaryBookEntryV2BodyLayoutLines,
  getDiaryBookEntryV2BodyLayoutLinesAll,
} from "@/lib/journal/diaryBookEntryBodyWrap";
import { getDiaryBookEntryV2BodyFontLayout } from "@/lib/journal/diaryBookEntryBodyFontLayout";
import {
  resolveDiaryBookEntryV2CommentRenderLayout,
} from "@/lib/journal/diaryBookEntryCommentWrap";
import { DiaryBookEntryLayoutRuler } from "@/components/journal/DiaryBookEntryLayoutRuler";
import {
  estimateDiaryBookEntryDateRowLayoutWidthPx,
  getDiaryBookEntryLayoutRulerAnchor,
  type DiaryBookEntryLayoutRulerTarget,
} from "@/lib/journal/diaryBookEntryLayoutRuler";
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
  DIARY_BOOK_ENTRY_V2_USE_COMPANION_OVERLAY,
  DIARY_BOOK_ENTRY_V2_USE_PHOTO_OVERLAY,
  getDiaryBookEntryCompanionBox,
  getDiaryBookEntryDateRowLeftPx,
  getDiaryBookEntryNumberLabelBox,
  getDiaryBookEntryNumberSlotBox,
  getDiaryBookEntryPhotoLabelRotateOriginPx,
  getDiaryBookEntryPhotoRotateOriginPx,
} from "@/lib/journal/diaryBookEntryPrintLayout";
import {
  diaryBookBodyDesignBackgroundPathForCompanion,
  diaryBookBodyDesignBaseTemplatePath,
  diaryBookBodyDesignPhotoOverlayPathForCompanion,
  diaryBookBodyDesignTemplatePathForCompanion,
  diaryBookPhotoMemoryLoadingImagePath,
} from "@/lib/journal/diaryBookAssets";
import { diaryBookEntryCompanionImagePath } from "@/lib/journal/diaryBookEntryAssets";
import { DIARY_PREVIEW_BODY_FONT_FAMILY } from "@/lib/journal/diaryPreviewBodyFont";
import { DIARY_PREVIEW_LABEL_BASE_STYLE } from "@/lib/journal/diaryPreviewLabelFont";
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
} from "@/lib/journal/diaryPreviewFixedLayout";
import { normalizeContentFontMode } from "@/lib/journal/contentFontMode";
import { JOURNAL_OWL_COMMENT_KANTEI_REQUIRED_MESSAGE } from "@/lib/journal/kanteiCommentCopy";
import { getActivityBindingLabelLines } from "@/lib/journal/activityBindingLabelLines";
import { getCompanionReadingHeading, normalizeCompanionType } from "@/lib/journal/meta";
import { moodOwlIconImagePath } from "@/lib/journal/moodAssets";

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
  /** レイアウト微調整用の 5px 基準マス（プレビュー専用・?ruler=photo 等） */
  layoutRulerTarget?: DiaryBookEntryLayoutRulerTarget | null;
  /** companion = キャラ別1枚絵。base = 共通背景（キャラなし・合成試作） */
  backgroundTemplate?: "companion" | "base";
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

function sectionTitleStyle(fontSizePx: number, extra?: CSSProperties): CSSProperties {
  return {
    ...DIARY_PREVIEW_LABEL_BASE_STYLE,
    fontSize: `${fontSizePx}px`,
    letterSpacing: labelLetterSpacingPx(fontSizePx),
    color: DIARY_BOOK_ENTRY_V2_COLORS.header,
    ...extra,
  };
}

function tapeTitleStyle(fontSizePx: number, extra?: CSSProperties): CSSProperties {
  return sectionTitleStyle(fontSizePx, {
    color: DIARY_BOOK_ENTRY_V2_COLORS.textMuted,
    ...extra,
  });
}

function EntryTextLines({
  lines,
  widthPx,
  heightPx,
  fontSizePx,
  lineHeight,
  letterSpacing,
  lineBaseStyle,
  clipOverflow = true,
}: {
  lines: string[];
  widthPx: number;
  heightPx?: number;
  fontSizePx: number;
  lineHeight: number;
  letterSpacing?: string;
  lineBaseStyle: CSSProperties;
  clipOverflow?: boolean;
}) {
  const lineBoxPx = fontSizePx * lineHeight;
  return (
    <div
      className={clipOverflow ? "overflow-hidden" : undefined}
      style={{
        ...absBox(0, 0, widthPx, heightPx),
        fontFamily: DIARY_PREVIEW_BODY_FONT_FAMILY,
        color: DIARY_BOOK_ENTRY_V2_COLORS.text,
        ...(clipOverflow ? {} : { overflowX: "visible", overflowY: "hidden" }),
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
 * 背景 PNG + 動的オーバーレイ。DiaryBookEntryPdfPage と同一レイアウト。
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
  layoutRulerTarget = null,
  backgroundTemplate = "companion",
}: DiaryBookEntryV2PreviewPageProps) {
  const contentFontMode = normalizeContentFontMode(contentFontModeProp);
  const trimmedBody = content.trim();
  const dateSegments = getDiaryPreviewDateRowSegments(previewDate).filter(
    (segment) => segment.key !== "label",
  );
  const dateFontSizePx = DIARY_BOOK_ENTRY_V2_DATE.fontSizePx;
  const dateRowLeftPx = getDiaryBookEntryDateRowLeftPx(dateSegments, dateFontSizePx);
  const dateRowWidthPx = estimateDiaryBookEntryDateRowLayoutWidthPx(dateSegments, dateFontSizePx);
  const layoutRulerAnchor =
    layoutRulerTarget != null
      ? getDiaryBookEntryLayoutRulerAnchor(layoutRulerTarget, dateRowLeftPx, dateRowWidthPx)
      : null;

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

  const moodTextLines = getActivityBindingLabelLines(activity);

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
  const numbersCfg = DIARY_BOOK_ENTRY_V2_NUMBERS;
  const moodCfg = DIARY_BOOK_ENTRY_V2_MOOD;
  const bodyCfg = DIARY_BOOK_ENTRY_V2_BODY;
  const commentCfg = DIARY_BOOK_ENTRY_V2_COMMENT;
  const bodyFontLayout = getDiaryBookEntryV2BodyFontLayout(contentFontMode);
  const commentFontSizePx = commentCfg.contentFontSizePx * commentLayout.fontScale;
  const companionBox = getDiaryBookEntryCompanionBox(companionType ?? "owl");
  const showCompanionOverlay =
    DIARY_BOOK_ENTRY_V2_USE_COMPANION_OVERLAY && backgroundTemplate === "base";
  const backgroundSrc = showCompanionOverlay
    ? diaryBookBodyDesignBackgroundPathForCompanion(companionType ?? "owl")
    : backgroundTemplate === "base"
      ? diaryBookBodyDesignBaseTemplatePath()
      : diaryBookBodyDesignTemplatePathForCompanion(companionType ?? "owl");
  const companionSrc = diaryBookEntryCompanionImagePath(companionType ?? "owl");
  const photoOverlaySrc = DIARY_BOOK_ENTRY_V2_USE_PHOTO_OVERLAY
    ? diaryBookBodyDesignPhotoOverlayPathForCompanion(companionType ?? "owl")
    : null;

  const photoRotateOrigin = getDiaryBookEntryPhotoRotateOriginPx();
  const photoLabelRotateOrigin = getDiaryBookEntryPhotoLabelRotateOriginPx();

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: `${DIARY_BOOK_ENTRY_V2_DESIGN.widthPx}px`,
        height: `${DIARY_BOOK_ENTRY_V2_DESIGN.heightPx}px`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        src={backgroundSrc}
        className="absolute inset-0 h-full w-full object-fill"
        draggable={false}
      />

      {hasPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          src={photoDisplaySrc}
          className="absolute object-cover"
          style={{
            ...absBox(
              photo.contentLeftPx,
              photo.contentTopPx,
              photo.contentSizePx,
              photo.contentSizePx,
            ),
            transform: `rotate(${photo.contentRotateDeg}deg)`,
            transformOrigin: `${photoRotateOrigin.xPx}px ${photoRotateOrigin.yPx}px`,
          }}
        />
      ) : null}

      {showPhotoLoading ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          src={diaryBookPhotoMemoryLoadingImagePath()}
          className="absolute object-contain opacity-80"
          style={{
            ...absBox(
              photo.contentLeftPx,
              photo.contentTopPx,
              photo.contentSizePx,
              photo.contentSizePx,
            ),
            transform: `rotate(${photo.contentRotateDeg}deg)`,
            transformOrigin: `${photoRotateOrigin.xPx}px ${photoRotateOrigin.yPx}px`,
          }}
        />
      ) : null}

      {DIARY_BOOK_ENTRY_V2_USE_PHOTO_OVERLAY && photoOverlaySrc ? (
        <>
          {/* 写真枠装飾（テープ・花・枠線）を写真の上に重ねる */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            src={photoOverlaySrc}
            className="pointer-events-none absolute inset-0 h-full w-full object-fill"
            draggable={false}
          />
        </>
      ) : null}

      <div
        className="absolute inline-flex max-w-none items-center whitespace-nowrap"
        style={{ left: `${dateRowLeftPx}px`, top: `${DIARY_BOOK_ENTRY_V2_DATE.topPx}px` }}
      >
        {dateSegments.map((segment, index) => (
          <span
            key={segment.key}
            style={{
              ...DIARY_PREVIEW_LABEL_BASE_STYLE,
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

      <div
        className="absolute flex items-center justify-center text-center"
        style={{
          ...absBox(
            photo.labelLeftPx,
            photo.labelTopPx,
            photo.labelWidthPx,
            photo.labelHeightPx,
          ),
          ...tapeTitleStyle(photo.labelFontSizePx),
          transform: `rotate(${photo.contentRotateDeg}deg)`,
          transformOrigin: `${photoLabelRotateOrigin.xPx - photo.labelLeftPx}px ${photoLabelRotateOrigin.yPx - photo.labelTopPx}px`,
        }}
      >
        {photo.labelText}
      </div>

      <div
        className="absolute text-center"
        style={{
          ...absBox(numbersCfg.headerLeftPx, numbersCfg.headerTopPx, numbersCfg.headerWidthPx),
          ...sectionTitleStyle(numbersCfg.headerFontSizePx),
        }}
      >
        {numbersCfg.headerText}
      </div>

      {(["day", "month", "year"] as const).map((_, index) => {
        const slotBox = getDiaryBookEntryNumberSlotBox(index);
        const labelBox = getDiaryBookEntryNumberLabelBox(index);
        const valueKey = numbersCfg.keys[index];
        const offset = numbersCfg.valueOffsetPx;
        return (
          <div key={numbersCfg.labels[index]}>
            <div
              className="absolute flex items-center justify-center"
              style={absBox(
                slotBox.leftPx + offset.x,
                slotBox.topPx + offset.y,
                slotBox.widthPx,
                slotBox.heightPx,
              )}
            >
              <span
                style={{
                  fontFamily: DIARY_PREVIEW_BODY_FONT_FAMILY,
                  fontSize: `${numbersCfg.valueFontSizePx}px`,
                  fontWeight: 600,
                  color: DIARY_BOOK_ENTRY_V2_COLORS.numberValue,
                }}
              >
                {numberValuesByKey[valueKey]}
              </span>
            </div>
            <div
              className="absolute flex items-center justify-center text-center font-bold"
              style={{
                ...absBox(
                  labelBox.leftPx,
                  labelBox.topPx,
                  labelBox.widthPx,
                  labelBox.heightPx,
                ),
                fontSize: `${numbersCfg.labelFontSizePx}px`,
                letterSpacing: labelLetterSpacingPx(numbersCfg.labelFontSizePx),
                color: DIARY_BOOK_ENTRY_V2_COLORS.textMuted,
              }}
            >
              {numbersCfg.labels[index]}
            </div>
          </div>
        );
      })}

      <div
        className="absolute text-center"
        style={{
          ...absBox(moodCfg.headerLeftPx, moodCfg.headerTopPx, moodCfg.headerWidthPx),
          ...sectionTitleStyle(moodCfg.headerFontSizePx),
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

      <div
        className="absolute overflow-hidden"
        style={absBox(
          moodCfg.textLeftPx,
          moodCfg.textTopPx,
          moodCfg.textWidthPx,
          moodCfg.textHeightPx,
        )}
      >
        <div
          className="flex h-full flex-col justify-center"
          style={{ width: `${moodCfg.textWidthPx}px` }}
        >
          <EntryTextLines
            lines={moodTextLines}
            widthPx={moodCfg.textWidthPx}
            fontSizePx={moodCfg.textFontSizePx}
            lineHeight={moodCfg.textLineHeight}
            letterSpacing={labelLetterSpacingPx(moodCfg.textFontSizePx)}
            lineBaseStyle={{
              ...DIARY_PREVIEW_BODY_LINE_BASE_STYLE,
              fontWeight: moodCfg.textFontWeight,
            }}
          />
        </div>
      </div>

      <div
        className="absolute flex items-center justify-center text-center"
        style={{
          ...absBox(
            bodyCfg.labelLeftPx,
            bodyCfg.labelTopPx,
            bodyCfg.labelWidthPx,
            bodyCfg.labelHeightPx,
          ),
          ...tapeTitleStyle(bodyCfg.labelFontSizePx),
        }}
      >
        {bodyCfg.labelText}
      </div>

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
        className="absolute flex items-center justify-center text-center"
        style={{
          ...absBox(
            commentCfg.labelLeftPx,
            commentCfg.labelTopPx,
            commentCfg.labelWidthPx,
            commentCfg.labelHeightPx,
          ),
          ...tapeTitleStyle(commentCfg.labelFontSizePx),
        }}
      >
        {commentHeading}
      </div>

      <div
        className="absolute"
        style={{
          ...absBox(
            commentCfg.contentLeftPx,
            commentCfg.contentTopPx,
            commentCfg.contentWidthPx,
            commentCfg.contentHeightPx,
          ),
          boxSizing: "border-box",
          paddingRight: `${commentCfg.contentPaddingRightPx}px`,
          overflowX: "visible",
          overflowY: "hidden",
        }}
      >
        <EntryTextLines
          lines={commentLayout.lines}
          widthPx={commentCfg.contentWidthPx - commentCfg.contentPaddingRightPx}
          heightPx={commentCfg.contentHeightPx}
          fontSizePx={commentFontSizePx}
          lineHeight={commentLayout.lineHeight}
          lineBaseStyle={DIARY_PREVIEW_COMMENT_LINE_BASE_STYLE}
          clipOverflow={false}
        />
      </div>

      {showCompanionOverlay ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          src={companionSrc}
          className="absolute object-contain"
          style={{
            ...absBox(
              companionBox.leftPx,
              companionBox.topPx,
              companionBox.widthPx,
              companionBox.heightPx,
            ),
            objectPosition: "left bottom",
          }}
          draggable={false}
        />
      ) : null}

      {DIARY_BOOK_ENTRY_V2_FOOTER.showInDesignBackground ? (
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
      ) : null}

      {layoutRulerAnchor && layoutRulerTarget ? (
        <DiaryBookEntryLayoutRuler
          target={layoutRulerTarget}
          leftPx={layoutRulerAnchor.leftPx}
          topPx={layoutRulerAnchor.topPx}
        />
      ) : null}
    </div>
  );
}
