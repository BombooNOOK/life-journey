"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { MoodOwlIcon } from "@/components/journal/MoodOwlIcon";
import {
  getActivityMeta,
  getCompanionReadingHeading,
  normalizeCompanionType,
  type DiaryDesignId,
} from "@/lib/journal/meta";
import { DiaryPreviewFrameBackground } from "@/components/journal/DiaryPreviewFrameBackground";
import { DiaryPreviewGoldFrameOverlay } from "@/components/journal/DiaryPreviewGoldFrameOverlay";
import { DIARY_PREVIEW_GOLD_FRAME_PAGE_BG } from "@/lib/journal/diaryPreviewGoldFrame";
import { diaryTemplatePathForCompanion } from "@/lib/journal/templateAssets";
import { normalizeContentFontMode } from "@/lib/journal/contentFontMode";
import {
  countBodyLayoutLinesBeyondBindingPreview,
  getBodyLayoutLines,
  getBodyLayoutLinesForBindingPreview,
  getDiaryBodyLineLimit,
  isDiaryBodyOverLineLimit,
} from "@/lib/journal/diaryPreviewBodyLineLimits";
import { DIARY_PREVIEW_BODY_FONT_FAMILY } from "@/lib/journal/diaryPreviewBodyFont";
import {
  DIARY_PREVIEW_BODY_LINES_CONTAINER_STYLE,
  getDiaryPreviewBodyLineStyle,
  getDiaryPreviewCommentLineStyle,
} from "@/lib/journal/diaryPreviewBodyLineDisplay";
import {
  DIARY_COMMENT_PDF_REGION_HEIGHT_PX,
  resolveDiaryCommentPdfRenderLayout,
} from "@/lib/journal/diaryCommentPdfWrap";
import {
  DIARY_PREVIEW_BODY_LABEL_STYLE,
  DIARY_PREVIEW_BODY_LABEL_TEXT,
  getDiaryPreviewBodyContentRegionBox,
  DIARY_PREVIEW_BODY_TEXT_COLOR,
  getDiaryPreviewBodyLabelCenterYPct,
  getDiaryPreviewBodyLabelLeftPct,
  DIARY_PREVIEW_COMMENT_INNER_PADDING,
  DIARY_PREVIEW_COMMENT_INNER_PADDING_PX,
  DIARY_PREVIEW_COMMENT_LABEL_STYLE,
  DIARY_PREVIEW_COMMENT_TEXT_STYLE,
  getDiaryPreviewCommentContentRegionBox,
  getDiaryPreviewCommentLabelCenterYPct,
  getDiaryPreviewCommentLabelLeftPct,
  DIARY_PREVIEW_DATE_ROW_STYLE,
  getDiaryPreviewDateRowSegments,
  getDiaryPreviewDateRowTextStyle,
  getDiaryPreviewDateRowTopPct,
  DIARY_PREVIEW_ACTIVITY_ANSWER_SLOT_HEIGHT_PX,
  DIARY_PREVIEW_ACTIVITY_ANSWER_TEXT_NUDGE_Y_PX,
  getDiaryPreviewActivityAnswerSlotTopPx,
  DIARY_PREVIEW_ACTIVITY_LABEL_STYLE,
  DIARY_PREVIEW_ACTIVITY_QUESTION_TEXT,
  getDiaryPreviewActivityAnswerLeftPct,
  getDiaryPreviewActivityAnswerWidthPct,
  getDiaryPreviewActivityQuestionCenterYPct,
  getDiaryPreviewActivityQuestionLabelLeftPct,
  getFixedPreviewActivityTextStyle,
  DIARY_PREVIEW_MOOD_EMOJI,
  DIARY_PREVIEW_NUMBER_STYLE,
  DIARY_PREVIEW_NUMBER_MOOD_LABEL_STYLE,
  DIARY_PREVIEW_NUMBER_MOOD_ROWS,
  getDiaryPreviewMoodSlotCenterYPct,
  getDiaryPreviewNumberMoodLabelLeftPct,
  getDiaryPreviewNumberMoodRowCenterYPct,
  getDiaryPreviewNumberMoodValueCenterXPct,
  getDiaryPreviewNumberTextStyle,
  DIARY_PREVIEW_PHOTO_LABEL_STYLE,
  DIARY_PREVIEW_PHOTO_LABEL_TEXT,
  getDiaryPreviewPhotoLabelCenterXPct,
  getDiaryPreviewPhotoLabelCenterYPct,
  getDiaryPreviewPhotoLeftPct,
  getDiaryPreviewPhotoTopPct,
  getDiaryPreviewPhotoWidthPct,
  DIARY_PREVIEW_OVERLAY_FONT,
  DIARY_PREVIEW_PAGE_HEIGHT,
  DIARY_PREVIEW_PAGE_WIDTH,
  DIARY_PREVIEW_BODY_LINES_CLIP_INNER_CLASS,
  DIARY_PREVIEW_COMMENT_LINES_INNER_CLASS,
  DIARY_PREVIEW_SCROLL_INNER_CLASS,
  DIARY_PREVIEW_TITLE_REGION,
  DIARY_PREVIEW_TITLE_STYLE,
  DIARY_PREVIEW_TITLE_TEXT,
  getDiaryPreviewBodySafeScrollHeightPx,
  getFixedPreviewBodyTextStyle,
} from "@/lib/journal/diaryPreviewFixedLayout";
import type { DiaryPreviewRegionBox } from "@/lib/journal/diaryDesignPreviewTiers";
import { diaryBookPhotoMemoryLoadingImagePath } from "@/lib/journal/diaryBookAssets";
import { JOURNAL_OWL_COMMENT_KANTEI_REQUIRED_MESSAGE } from "@/lib/journal/kanteiCommentCopy";

const DIARY_PHOTO_MEMORY_LOADING_LABEL = "思い出を開いています…";

function DiaryPreviewPhotoFrame({
  photoDisplaySrc,
  photoLoading,
}: {
  photoDisplaySrc: string;
  photoLoading: boolean;
}) {
  const [imageReady, setImageReady] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const hasPhoto = photoLoading || Boolean(photoDisplaySrc);
  const showPlaceholder = hasPhoto && (photoLoading || !imageReady);

  useEffect(() => {
    setImageReady(false);
  }, [photoDisplaySrc]);

  useLayoutEffect(() => {
    const img = imgRef.current;
    if (!photoDisplaySrc || !img) return;
    if (img.complete && img.naturalHeight > 0) {
      setImageReady(true);
    }
  }, [photoDisplaySrc]);

  if (!hasPhoto) {
    return <div className="h-full w-full bg-[#f8f4ea]/80" aria-hidden />;
  }

  return (
    <div className="relative h-full w-full bg-[#f8f4ea]/80">
      {showPlaceholder ? (
        <div
          className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-[6px] px-[8px] py-[6px] transition-opacity duration-300 ease-out"
          role="status"
          aria-live="polite"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={diaryBookPhotoMemoryLoadingImagePath()}
            alt=""
            className="max-h-[76%] max-w-[76%] object-contain opacity-80"
            draggable={false}
          />
          <p
            className="text-center leading-tight text-stone-600/90"
            style={{
              fontFamily: DIARY_PREVIEW_OVERLAY_FONT,
              fontSize: "13px",
            }}
          >
            {DIARY_PHOTO_MEMORY_LOADING_LABEL}
          </p>
        </div>
      ) : null}
      {photoDisplaySrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={photoDisplaySrc}
          alt="日記写真プレビュー"
          onLoad={() => setImageReady(true)}
          onError={() => setImageReady(true)}
          className={[
            "relative z-[2] h-full w-full object-contain transition-opacity duration-300 ease-out",
            imageReady ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />
      ) : null}
    </div>
  );
}

export type DiaryPreviewFixedPageProps = {
  designTheme: DiaryDesignId;
  /** 背景テンプレ PNG（罫線なし・キャラ別） */
  companionType?: string | null;
  mood: string;
  activity: string;
  content: string;
  comment?: string | null;
  photoDataUrl?: string | null;
  /** Blob / legacy 共通の認証付き写真 URL */
  photoSrc?: string | null;
  /** hasPhoto だが写真 URL 未取得のとき */
  photoLoading?: boolean;
  previewDate?: Date;
  diaryNumbers?: {
    today: number;
    month: number;
    year: number;
    calmness: number;
  };
  contentFontMode?: string | null;
  /** false のとき未鑑定プロフィール向け案内を表示 */
  kanteiOrderExists?: boolean;
  /** ?bodyLinesDebug=1 — 行配列確認・行ごと背景（本文のみ） */
  bodyLinesDebug?: boolean;
  /** false のとき SVG 金枠を描画しない（日記ブック本文用） */
  showGoldFrame?: boolean;
  /** 背景テンプレ PNG を上書き（日記ブック本文テンプレ等） */
  templateSrc?: string;
};

function PreviewScrollRegion({
  region,
  textClassName,
  textStyle,
  innerClassName = DIARY_PREVIEW_SCROLL_INNER_CLASS,
  children,
}: {
  region: DiaryPreviewRegionBox;
  textClassName: string;
  textStyle?: CSSProperties;
  innerClassName?: string;
  children: ReactNode;
}) {
  return (
    <div
      className="absolute overflow-hidden"
      style={{
        left: region.left,
        top: region.top,
        width: region.width,
        height: region.heightPct,
      }}
    >
      <div
        className={[innerClassName, textClassName].join(" ")}
        style={textStyle}
      >
        {children}
      </div>
    </div>
  );
}

/** 本文のみ：フクロウ欄手前までクリップ（製本プレビュー・スクロールなし・ページ内警告なし） */
function BodyPreviewClipRegion({
  region,
  textClassName,
  textStyle,
  children,
}: {
  region: DiaryPreviewRegionBox;
  textClassName: string;
  textStyle?: CSSProperties;
  children: ReactNode;
}) {
  const safeClipHeightPx = getDiaryPreviewBodySafeScrollHeightPx();

  return (
    <div
      className="absolute overflow-hidden"
      style={{
        left: region.left,
        top: region.top,
        width: region.width,
        height: region.heightPct,
      }}
    >
      <div
        className={[DIARY_PREVIEW_BODY_LINES_CLIP_INNER_CLASS, textClassName].join(" ")}
        style={{
          ...textStyle,
          height: safeClipHeightPx,
          maxHeight: safeClipHeightPx,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * 724×1024px 固定の製本プレビュー1ページ（テンプレ PNG 1:1・tier なし）。
 */
export function DiaryPreviewFixedPage({
  designTheme: _designTheme,
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
  showGoldFrame = true,
  templateSrc: templateSrcProp,
}: DiaryPreviewFixedPageProps) {
  const photoDisplaySrc = photoDataUrl?.trim() || photoSrc?.trim() || "";
  const activityLabel = getActivityMeta(activity).label;
  const trimmedBody = content.trim();
  const contentFontMode = normalizeContentFontMode(contentFontModeProp);
  const { maxLines: bodyMaxLines } = getDiaryBodyLineLimit(contentFontMode);
  const allBodyLayoutLines = trimmedBody
    ? getBodyLayoutLines(trimmedBody, contentFontMode)
    : [];
  const bindingBodyOverflow = trimmedBody
    ? isDiaryBodyOverLineLimit(trimmedBody, contentFontMode)
    : false;
  /** 製本ページ内は常に載る行数まで（警告はページ外のオレンジ枠のみ） */
  const bodyLayoutLines = trimmedBody
    ? getBodyLayoutLinesForBindingPreview(trimmedBody, contentFontMode)
    : ["ここに本文が入ります。"];
  const hiddenLineCount = trimmedBody
    ? countBodyLayoutLinesBeyondBindingPreview(trimmedBody, contentFontMode)
    : 0;

  useEffect(() => {
    if (!bodyLinesDebug || !trimmedBody) return;
    console.log("[diary-preview-fixed-page body lines]", {
      contentFontMode,
      bodyMaxLines,
      totalLineCount: allBodyLayoutLines.length,
      displayedLineCount: bodyLayoutLines.length,
      hiddenLineCount,
      bindingBodyOverflow,
      allLines: allBodyLayoutLines,
    });
  }, [
    bodyLinesDebug,
    trimmedBody,
    contentFontMode,
    bodyLayoutLines,
    allBodyLayoutLines,
    bodyMaxLines,
    hiddenLineCount,
    bindingBodyOverflow,
  ]);
  const resolvedCompanionType = normalizeCompanionType(companionType);
  const commentHeading = getCompanionReadingHeading(resolvedCompanionType);
  const owlComment =
    comment?.trim() ||
    (kanteiOrderExists === false
      ? JOURNAL_OWL_COMMENT_KANTEI_REQUIRED_MESSAGE
      : `保存後に「${commentHeading}」がここに入ります。`);
  const commentBaseFontPx = parseFloat(DIARY_PREVIEW_COMMENT_TEXT_STYLE.fontSize);
  const commentLayout = resolveDiaryCommentPdfRenderLayout(owlComment, {
    baseFontSizePx: Number.isFinite(commentBaseFontPx) ? commentBaseFontPx : 12,
    regionHeightPx:
      DIARY_COMMENT_PDF_REGION_HEIGHT_PX -
      DIARY_PREVIEW_COMMENT_INNER_PADDING_PX.top -
      DIARY_PREVIEW_COMMENT_INNER_PADDING_PX.bottom,
  });
  const commentLines = commentLayout.lines;
  const commentTextStyle = {
    fontSize: `${commentBaseFontPx * commentLayout.fontScale}px`,
    lineHeight: String(commentLayout.lineHeight),
  };
  const displayedNumbers = diaryNumbers ?? { today: "-", month: "-", year: "-", calmness: "-" };
  const bodyTextStyle = getFixedPreviewBodyTextStyle(contentFontMode);
  const dateTextStyle = getDiaryPreviewDateRowTextStyle(contentFontMode);
  const numberTextStyle = getDiaryPreviewNumberTextStyle(contentFontMode);
  const activityTextStyle = getFixedPreviewActivityTextStyle();

  const templateSrc =
    templateSrcProp ?? diaryTemplatePathForCompanion(companionType ?? "owl");

  return (
    <div
      className="relative shrink-0 [container-type:inline-size] [-webkit-text-size-adjust:100%] [text-size-adjust:100%]"
      style={{
        width: DIARY_PREVIEW_PAGE_WIDTH,
        height: DIARY_PREVIEW_PAGE_HEIGHT,
        backgroundColor: showGoldFrame ? DIARY_PREVIEW_GOLD_FRAME_PAGE_BG : "#ffffff",
      }}
    >
      <DiaryPreviewFrameBackground src={templateSrc} />
      {showGoldFrame ? <DiaryPreviewGoldFrameOverlay /> : null}
      <div
        className="absolute inset-0 z-10 antialiased"
        style={{ fontFamily: DIARY_PREVIEW_OVERLAY_FONT }}
      >
        <div
          className="absolute flex items-center justify-center"
          style={{
            left: DIARY_PREVIEW_TITLE_REGION.left,
            top: DIARY_PREVIEW_TITLE_REGION.top,
            width: DIARY_PREVIEW_TITLE_REGION.width,
            height: DIARY_PREVIEW_TITLE_REGION.heightPct,
            color: DIARY_PREVIEW_TITLE_STYLE.color,
            fontFamily: DIARY_PREVIEW_TITLE_STYLE.fontFamily,
            fontSize: DIARY_PREVIEW_TITLE_STYLE.fontSize,
            lineHeight: DIARY_PREVIEW_TITLE_STYLE.lineHeight,
            letterSpacing: DIARY_PREVIEW_TITLE_STYLE.letterSpacing,
          }}
          aria-hidden
        >
          <p className="m-0 text-center">{DIARY_PREVIEW_TITLE_TEXT}</p>
        </div>
        <div
          className="absolute left-0 flex w-full items-center justify-center whitespace-nowrap font-bold [font-variant-numeric:tabular-nums]"
          style={{
            top: getDiaryPreviewDateRowTopPct(contentFontMode),
            color: DIARY_PREVIEW_DATE_ROW_STYLE.color,
            fontSize: dateTextStyle.fontSize,
            lineHeight: dateTextStyle.lineHeight,
            letterSpacing: DIARY_PREVIEW_DATE_ROW_STYLE.letterSpacing,
            gap: `${DIARY_PREVIEW_DATE_ROW_STYLE.segmentGapPx}px`,
          }}
        >
          {getDiaryPreviewDateRowSegments(previewDate).map((segment) => (
            <span key={segment.key}>{segment.text}</span>
          ))}
        </div>
        <div
          className="absolute flex items-center whitespace-nowrap"
          style={{
            left: getDiaryPreviewActivityQuestionLabelLeftPct(),
            top: getDiaryPreviewActivityQuestionCenterYPct(),
            height: DIARY_PREVIEW_NUMBER_STYLE.slotHeightPx,
            transform: "translateY(-50%)",
            color: DIARY_PREVIEW_ACTIVITY_LABEL_STYLE.color,
            fontSize: DIARY_PREVIEW_ACTIVITY_LABEL_STYLE.fontSize,
            lineHeight: 1,
            fontWeight: DIARY_PREVIEW_ACTIVITY_LABEL_STYLE.fontWeight,
            letterSpacing: DIARY_PREVIEW_ACTIVITY_LABEL_STYLE.letterSpacing,
          }}
        >
          {DIARY_PREVIEW_ACTIVITY_QUESTION_TEXT}
        </div>
        <div
          className="absolute box-border flex items-center justify-start"
          style={{
            left: getDiaryPreviewActivityAnswerLeftPct(),
            top: getDiaryPreviewActivityAnswerSlotTopPx(),
            width: getDiaryPreviewActivityAnswerWidthPct(),
            height: DIARY_PREVIEW_ACTIVITY_ANSWER_SLOT_HEIGHT_PX,
            color: DIARY_PREVIEW_BODY_TEXT_COLOR,
            fontSize: activityTextStyle.fontSize,
            lineHeight: activityTextStyle.lineHeight,
          }}
        >
          <p
            className="m-0 w-full whitespace-pre-wrap break-words leading-[inherit]"
            style={{ transform: `translateY(${DIARY_PREVIEW_ACTIVITY_ANSWER_TEXT_NUDGE_Y_PX}px)` }}
          >
            {activityLabel.length > 62 ? `${activityLabel.slice(0, 62)}…` : activityLabel}
          </p>
        </div>
        <div
          className="absolute flex items-center whitespace-nowrap"
          style={{
            left: getDiaryPreviewBodyLabelLeftPct(),
            top: getDiaryPreviewBodyLabelCenterYPct(),
            height: DIARY_PREVIEW_NUMBER_STYLE.slotHeightPx,
            transform: "translateY(-50%)",
            color: DIARY_PREVIEW_BODY_LABEL_STYLE.color,
            fontSize: DIARY_PREVIEW_BODY_LABEL_STYLE.fontSize,
            lineHeight: 1,
            fontWeight: DIARY_PREVIEW_BODY_LABEL_STYLE.fontWeight,
            letterSpacing: DIARY_PREVIEW_BODY_LABEL_STYLE.letterSpacing,
          }}
        >
          {DIARY_PREVIEW_BODY_LABEL_TEXT}
        </div>
        <BodyPreviewClipRegion
          region={getDiaryPreviewBodyContentRegionBox()}
          textClassName=""
          textStyle={{
            ...bodyTextStyle,
            ...DIARY_PREVIEW_BODY_LINES_CONTAINER_STYLE,
            fontFamily: DIARY_PREVIEW_BODY_FONT_FAMILY,
            color: DIARY_PREVIEW_BODY_TEXT_COLOR,
          }}
        >
          <div
            data-body-layout-line-count={bodyLayoutLines.length}
            data-body-layout-line-max={bodyMaxLines}
            data-body-lines-hidden={hiddenLineCount}
            data-body-lines-debug={bodyLinesDebug ? "1" : undefined}
          >
            {bodyLayoutLines.map((line, index) => (
              <div
                key={index}
                role="presentation"
                data-body-line-index={index + 1}
                data-body-line-chars={line.length}
                data-body-line-in-binding={index < bodyMaxLines ? "1" : "0"}
                style={getDiaryPreviewBodyLineStyle(bodyTextStyle, {
                  debugVisual: bodyLinesDebug,
                  lineIndex: index,
                })}
              >
                {line.length > 0 ? line : "\u00a0"}
              </div>
            ))}
          </div>
        </BodyPreviewClipRegion>
        <div
          className="absolute flex items-center whitespace-nowrap"
          style={{
            left: getDiaryPreviewCommentLabelLeftPct(),
            top: getDiaryPreviewCommentLabelCenterYPct(),
            height: DIARY_PREVIEW_NUMBER_STYLE.slotHeightPx,
            transform: "translateY(-50%)",
            color: DIARY_PREVIEW_COMMENT_LABEL_STYLE.color,
            fontSize: DIARY_PREVIEW_COMMENT_LABEL_STYLE.fontSize,
            lineHeight: 1,
            fontWeight: DIARY_PREVIEW_COMMENT_LABEL_STYLE.fontWeight,
            letterSpacing: DIARY_PREVIEW_COMMENT_LABEL_STYLE.letterSpacing,
          }}
        >
          {commentHeading}
        </div>
        <div
          className="absolute overflow-x-visible overflow-y-hidden"
          style={{
            left: getDiaryPreviewCommentContentRegionBox().left,
            top: getDiaryPreviewCommentContentRegionBox().top,
            width: getDiaryPreviewCommentContentRegionBox().width,
            height: getDiaryPreviewCommentContentRegionBox().heightPct,
          }}
        >
          <div
            className={DIARY_PREVIEW_COMMENT_LINES_INNER_CLASS}
            style={{
              ...DIARY_PREVIEW_COMMENT_TEXT_STYLE,
              ...DIARY_PREVIEW_BODY_LINES_CONTAINER_STYLE,
              padding: DIARY_PREVIEW_COMMENT_INNER_PADDING,
              height: "100%",
              maxHeight: "100%",
            }}
          >
            {commentLines.map((line, index) => (
              <div
                key={`comment-line-${index}`}
                role="presentation"
                style={{
                  ...getDiaryPreviewCommentLineStyle(commentTextStyle),
                  letterSpacing: DIARY_PREVIEW_COMMENT_TEXT_STYLE.letterSpacing,
                  color: DIARY_PREVIEW_COMMENT_TEXT_STYLE.color,
                }}
              >
                {line.length > 0 ? line : "\u00a0"}
              </div>
            ))}
          </div>
        </div>
        {DIARY_PREVIEW_NUMBER_MOOD_ROWS.map((row) => (
          <div
            key={`${row.key}-label`}
            className="absolute flex items-center"
            style={{
              left: getDiaryPreviewNumberMoodLabelLeftPct(),
              top: getDiaryPreviewNumberMoodRowCenterYPct(row.key),
              height: DIARY_PREVIEW_NUMBER_STYLE.slotHeightPx,
              transform: "translateY(-50%)",
              color: DIARY_PREVIEW_NUMBER_MOOD_LABEL_STYLE.color,
              fontSize: DIARY_PREVIEW_NUMBER_MOOD_LABEL_STYLE.fontSize,
              lineHeight: 1,
              fontWeight: DIARY_PREVIEW_NUMBER_MOOD_LABEL_STYLE.fontWeight,
              letterSpacing: DIARY_PREVIEW_NUMBER_MOOD_LABEL_STYLE.letterSpacing,
              whiteSpace: "nowrap",
            }}
          >
            {row.label}
          </div>
        ))}
        {(
          [
            { key: "today" as const, value: displayedNumbers.today },
            { key: "month" as const, value: displayedNumbers.month },
            { key: "year" as const, value: displayedNumbers.year },
          ] as const
        ).map((slot) => (
          <div
            key={slot.key}
            className="absolute flex items-center justify-center font-bold [font-variant-numeric:tabular-nums]"
            style={{
              left: getDiaryPreviewNumberMoodValueCenterXPct(),
              top: getDiaryPreviewNumberMoodRowCenterYPct(slot.key),
              width: DIARY_PREVIEW_NUMBER_STYLE.slotWidthPx,
              height: DIARY_PREVIEW_NUMBER_STYLE.slotHeightPx,
              transform: "translate(-50%, -50%)",
              color: DIARY_PREVIEW_NUMBER_STYLE.color,
              fontSize: numberTextStyle.fontSize,
              lineHeight: 1,
            }}
          >
            {slot.value}
          </div>
        ))}
        <div
          className="absolute flex items-center justify-center"
          style={{
            left: getDiaryPreviewNumberMoodValueCenterXPct(),
            top: getDiaryPreviewMoodSlotCenterYPct(),
            width: DIARY_PREVIEW_MOOD_EMOJI.boxPx,
            height: DIARY_PREVIEW_MOOD_EMOJI.boxPx,
            transform: "translate(-50%, -50%)",
          }}
          aria-hidden
        >
          <MoodOwlIcon moodId={mood} sizePx={DIARY_PREVIEW_MOOD_EMOJI.boxPx} />
        </div>
        <div
          className="absolute aspect-square overflow-hidden rounded-sm relative"
          style={{
            left: getDiaryPreviewPhotoLeftPct(),
            top: getDiaryPreviewPhotoTopPct(),
            width: getDiaryPreviewPhotoWidthPct(),
          }}
        >
          <DiaryPreviewPhotoFrame
            photoDisplaySrc={photoDisplaySrc}
            photoLoading={photoLoading}
          />
        </div>
        <div
          className="absolute z-[3] flex items-center justify-center whitespace-nowrap"
          style={{
            left: getDiaryPreviewPhotoLabelCenterXPct(),
            top: getDiaryPreviewPhotoLabelCenterYPct(),
            transform: "translate(-50%, -50%)",
            color: DIARY_PREVIEW_PHOTO_LABEL_STYLE.color,
            fontSize: DIARY_PREVIEW_PHOTO_LABEL_STYLE.fontSize,
            lineHeight: 1,
            fontWeight: DIARY_PREVIEW_PHOTO_LABEL_STYLE.fontWeight,
            letterSpacing: DIARY_PREVIEW_PHOTO_LABEL_STYLE.letterSpacing,
          }}
        >
          {DIARY_PREVIEW_PHOTO_LABEL_TEXT}
        </div>
      </div>
    </div>
  );
}
