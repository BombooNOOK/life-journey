"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { getActivityMeta, getMoodMeta, type DiaryDesignId } from "@/lib/journal/meta";
import { DiaryPreviewFrameBackground } from "@/components/journal/DiaryPreviewFrameBackground";
import { DiaryPreviewGoldFrameOverlay } from "@/components/journal/DiaryPreviewGoldFrameOverlay";
import { DIARY_PREVIEW_GOLD_FRAME_PAGE_BG } from "@/lib/journal/diaryPreviewGoldFrame";
import { diaryTemplatePathForCompanion } from "@/lib/journal/templateAssets";
import {
  DEFAULT_CONTENT_FONT_MODE,
  normalizeContentFontMode,
} from "@/lib/journal/contentFontMode";
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
} from "@/lib/journal/diaryPreviewBodyLineDisplay";
import {
  DIARY_PREVIEW_BODY_REGION,
  DIARY_PREVIEW_COMMENT_REGION,
  DIARY_PREVIEW_COMMENT_INNER_PADDING,
  DIARY_PREVIEW_COMMENT_TEXT_STYLE,
  DIARY_PREVIEW_DATE_ROW_NUDGE,
  DIARY_PREVIEW_DATE_ROW_STYLE,
  DIARY_PREVIEW_ACTIVITY_ANSWER_NUDGE_Y_PX,
  DIARY_PREVIEW_ACTIVITY_ANSWER_SLOT_HEIGHT_PX,
  DIARY_PREVIEW_ACTIVITY_ANSWER_SLOT_TOP_PX,
  getFixedPreviewActivityTextStyle,
  DIARY_PREVIEW_MOOD_EMOJI,
  DIARY_PREVIEW_NUMBER_STYLE,
  DIARY_PREVIEW_OVERLAY_FONT,
  DIARY_PREVIEW_PAGE_HEIGHT,
  DIARY_PREVIEW_PAGE_WIDTH,
  DIARY_PREVIEW_BODY_LINES_CLIP_INNER_CLASS,
  DIARY_PREVIEW_SCROLL_INNER_CLASS,
  DIARY_PREVIEW_TEMPLATE_LAYOUT,
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
            className="max-h-[68%] max-w-[68%] object-contain"
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
  const moodEmoji = getMoodMeta(mood).emoji;
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
  const owlComment =
    comment?.trim() ||
    (kanteiOrderExists === false
      ? JOURNAL_OWL_COMMENT_KANTEI_REQUIRED_MESSAGE
      : "保存後に「フクロウ先生の読み解き」がここに入ります。");
  const layout = DIARY_PREVIEW_TEMPLATE_LAYOUT;
  const weekdayLabel = ["日", "月", "火", "水", "木", "金", "土"][previewDate.getDay()];
  const displayedNumbers = diaryNumbers ?? { today: "-", month: "-", year: "-", calmness: "-" };
  const bodyTextStyle = getFixedPreviewBodyTextStyle(
    contentFontModeProp ?? DEFAULT_CONTENT_FONT_MODE,
  );
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
        {(
          [
            { left: layout.dateYearLeft, text: String(previewDate.getFullYear()) },
            { left: layout.dateMonthLeft, text: String(previewDate.getMonth() + 1) },
            { left: layout.dateDayLeft, text: String(previewDate.getDate()) },
            { left: layout.dateWeekLeft, text: weekdayLabel, week: true },
          ] as const
        ).map((slot) => (
          <p
            key={slot.left}
            className="absolute whitespace-nowrap text-stone-700 [font-variant-numeric:tabular-nums]"
            style={{
              left: slot.left,
              top: layout.dateTop,
              fontSize: DIARY_PREVIEW_DATE_ROW_STYLE.fontSize,
              lineHeight: DIARY_PREVIEW_DATE_ROW_STYLE.lineHeight,
              letterSpacing:
                "week" in slot && slot.week
                  ? DIARY_PREVIEW_DATE_ROW_STYLE.weekLetterSpacing
                  : DIARY_PREVIEW_DATE_ROW_STYLE.letterSpacing,
              transform: DIARY_PREVIEW_DATE_ROW_NUDGE,
            }}
          >
            {slot.text}
          </p>
        ))}
        <div
          className="absolute box-border flex w-[64.8%] items-center justify-start text-stone-700"
          style={{
            left: layout.activityLeft,
            top: DIARY_PREVIEW_ACTIVITY_ANSWER_SLOT_TOP_PX,
            height: DIARY_PREVIEW_ACTIVITY_ANSWER_SLOT_HEIGHT_PX,
            transform: `translateY(${DIARY_PREVIEW_ACTIVITY_ANSWER_NUDGE_Y_PX}px)`,
            fontSize: activityTextStyle.fontSize,
            lineHeight: activityTextStyle.lineHeight,
          }}
        >
          <p className="m-0 w-full whitespace-pre-wrap break-words leading-[inherit]">
            {activityLabel.length > 62 ? `${activityLabel.slice(0, 62)}…` : activityLabel}
          </p>
        </div>
        <BodyPreviewClipRegion
          region={DIARY_PREVIEW_BODY_REGION}
          textClassName="text-stone-700/90"
          textStyle={{
            ...bodyTextStyle,
            ...DIARY_PREVIEW_BODY_LINES_CONTAINER_STYLE,
            fontFamily: DIARY_PREVIEW_BODY_FONT_FAMILY,
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
        <PreviewScrollRegion
          region={DIARY_PREVIEW_COMMENT_REGION}
          textClassName="text-stone-700/85"
          textStyle={{
            ...DIARY_PREVIEW_COMMENT_TEXT_STYLE,
            padding: DIARY_PREVIEW_COMMENT_INNER_PADDING,
          }}
        >
          {owlComment}
        </PreviewScrollRegion>
        {(
          [
            { top: layout.numberTodayTop, value: displayedNumbers.today },
            { top: layout.numberMonthTop, value: displayedNumbers.month },
            { top: layout.numberYearTop, value: displayedNumbers.year },
          ] as const
        ).map((slot) => (
          <div
            key={slot.top}
            className="absolute flex items-center justify-center font-semibold text-stone-700 [font-variant-numeric:tabular-nums]"
            style={{
              left: layout.numberLeft,
              top: slot.top,
              width: DIARY_PREVIEW_NUMBER_STYLE.slotWidthPx,
              height: DIARY_PREVIEW_NUMBER_STYLE.slotHeightPx,
              transform: "translate(-50%, -50%)",
              fontSize: DIARY_PREVIEW_NUMBER_STYLE.fontSize,
              lineHeight: 1,
            }}
          >
            {slot.value}
          </div>
        ))}
        <div
          className="absolute flex items-center justify-center text-stone-700"
          style={{
            left: layout.numberLeft,
            top: layout.numberCalmTop,
            width: DIARY_PREVIEW_MOOD_EMOJI.boxPx,
            height: DIARY_PREVIEW_MOOD_EMOJI.boxPx,
            transform: DIARY_PREVIEW_MOOD_EMOJI.transform,
            fontSize: `${DIARY_PREVIEW_MOOD_EMOJI.fontSizePx}px`,
            lineHeight: 1,
          }}
          aria-hidden
        >
          <span className="block translate-y-[1px] leading-none">{moodEmoji}</span>
        </div>
        <div
          className="absolute aspect-square overflow-hidden rounded-sm relative"
          style={{
            left: layout.photoLeft,
            top: layout.photoTop,
            width: layout.photoWidth,
          }}
        >
          <DiaryPreviewPhotoFrame
            photoDisplaySrc={photoDisplaySrc}
            photoLoading={photoLoading}
          />
        </div>
      </div>
    </div>
  );
}
