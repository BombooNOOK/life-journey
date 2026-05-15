"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import { getActivityMeta, getMoodMeta, type DiaryDesignId } from "@/lib/journal/meta";
import { diaryTemplateScreenImageMap } from "@/lib/journal/templateAssets";
import { JournalContentLengthAlerts } from "@/components/journal/JournalContentLengthAlerts";
import {
  contentFontModeToPreviewScale,
  DEFAULT_CONTENT_FONT_MODE,
  normalizeContentFontMode,
  PREVIEW_OVERFLOW_HINT_MESSAGE,
} from "@/lib/journal/contentFontMode";
import {
  DIARY_PREVIEW_LARGE_BODY_MAX_HEIGHT_PCT,
  DIARY_PREVIEW_LARGE_COMMENT_INNER_SURFACE_CLASS,
  DIARY_PREVIEW_TIER_BODY,
  DIARY_PREVIEW_TIER_COMMENT,
  DIARY_PREVIEW_TIER_DATE_ROW,
  DIARY_PREVIEW_TIER_NUMBER,
  PREVIEW_SHELL_MAX_WIDTH_PX,
  type DiaryPreviewTier,
  resolveDiaryPreviewTier,
} from "@/lib/journal/diaryDesignPreviewTiers";

type Props = {
  designTheme: DiaryDesignId;
  mood: string;
  activity: string;
  content: string;
  comment?: string | null;
  photoDataUrl?: string | null;
  previewDate?: Date;
  diaryNumbers?: {
    today: number;
    month: number;
    year: number;
    calmness: number;
  };
  /** DB の contentFontMode（英キー）。未指定は標準 */
  contentFontMode?: string | null;
};

type TemplateLayout = {
  dateYearLeft: string;
  dateMonthLeft: string;
  dateDayLeft: string;
  dateWeekLeft: string;
  dateTop: string;
  moodLeft: string;
  moodTop: string;
  activityLeft: string;
  activityTop: string;
  contentLeft: string;
  contentTop: string;
  contentWidth: string;
  commentLeft: string;
  commentTop: string;
  commentWidth: string;
  commentMaxHeight: string;
  numberLeft: string;
  numberTodayTop: string;
  numberMonthTop: string;
  numberYearTop: string;
  numberCalmTop: string;
};

const TEMPLATE_SIZE = { width: 724, height: 1024 };

/** シンプル系のみ（罫線あり／なしは背景画像の差）。座標は共通でキャラ差し替えでもずれない */
/** body と同じスタック（globals.css）で Mac / iOS のメトリクス差を抑える */
const OVERLAY_FONT_FAMILY =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans JP", "Hiragino Sans", "Hiragino Kaku Gothic ProN", sans-serif';

const TEMPLATE_LAYOUT: TemplateLayout = {
  /** 画像の「年」と被らないようやや左寄せ / 曜はやや左へ */
  dateYearLeft: "30.25%",
  dateMonthLeft: "44.3%",
  dateDayLeft: "51.85%",
  dateWeekLeft: "64.55%",
  /** 日付と気分ブロックの回答を同じだけ下げてテンプレの見出しと揃える */
  dateTop: "12.1%",
  moodLeft: "20.35%",
  moodTop: "35.65%",
  activityLeft: "16.95%",
  activityTop: "47.1%",
  contentLeft: "13.2%",
  /** 「今日の記録」本文：日付・気分と同じ 0.65% だけ下げて帯を揃える */
  contentTop: "55%",
  contentWidth: "72.8%",
  commentLeft: "9.15%",
  /** フクロウ先生コメント（画像の吹き出しに合わせる）— 上記と同量下げ */
  commentTop: "79.2%",
  commentWidth: "62.2%",
  commentMaxHeight: "19.8%",
  /** 丸印中心が画像より右下に見えるためわずかに左上へ */
  numberLeft: "36.02%",
  numberTodayTop: "19.52%",
  numberMonthTop: "24.92%",
  numberYearTop: "30.82%",
  numberCalmTop: "36.52%",
};

export function DiaryDesignPreview({
  designTheme,
  mood,
  activity,
  content,
  comment,
  photoDataUrl,
  previewDate = new Date(),
  diaryNumbers,
  contentFontMode: contentFontModeProp,
}: Props) {
  const moodEmoji = getMoodMeta(mood).emoji;
  const activityLabel = getActivityMeta(activity).label;
  const trimmedBody = content.trim();
  const bodyEmpty = !trimmedBody;
  const textPreview = trimmedBody || "ここに本文が入ります。";
  const owlComment = comment?.trim() || "保存後に「フクロウ先生の読み解き」がここに入ります。";
  const templateSize = TEMPLATE_SIZE;
  const layout = TEMPLATE_LAYOUT;
  const weekdayLabel = ["日", "月", "火", "水", "木", "金", "土"][previewDate.getDay()];
  const displayedNumbers = diaryNumbers ?? { today: "-", month: "-", year: "-", calmness: "-" };
  const contentFontMode = normalizeContentFontMode(contentFontModeProp ?? DEFAULT_CONTENT_FONT_MODE);
  const safeContentFontScale = Math.max(
    0.7,
    Math.min(1.2, contentFontModeToPreviewScale(contentFontMode)),
  );
  /**
   * 枠幅 cqw のみだと max が広い画面で大きくなりすぎ、狭い画面と差が出る。
   * min(cqw,cqh) で縦横の小さい方に寄せ、上限を抑えてデバイス間の差を縮める。
   */
  const sc = safeContentFontScale;
  const contentMid = `min(${(2.12 * sc).toFixed(3)}cqw, ${(2.98 * sc).toFixed(3)}cqh)`;
  const contentFontSize = `clamp(${(8 * sc).toFixed(2)}px, ${contentMid}, ${(10.25 * sc).toFixed(2)}px)`;
  const baseContentLineHeight = 1.95 * (1 / Math.max(safeContentFontScale, 0.85));
  const contentLineHeight = (baseContentLineHeight * 0.97).toFixed(3);

  const templateShellRef = useRef<HTMLDivElement>(null);
  const [tier, setTier] = useState<DiaryPreviewTier>("large");
  useLayoutEffect(() => {
    const el = templateShellRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const apply = (w: number) => setTier(resolveDiaryPreviewTier(w));
    const ro = new ResizeObserver((entries) => {
      apply(entries[0]?.contentRect.width ?? 0);
    });
    ro.observe(el);
    apply(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  const isLarge = tier === "large";
  const bodyScrollAff = !isLarge ? DIARY_PREVIEW_TIER_BODY[tier].scrollAffordance : null;
  const contentBodyMaxHeightPct = isLarge
    ? DIARY_PREVIEW_LARGE_BODY_MAX_HEIGHT_PCT
    : DIARY_PREVIEW_TIER_BODY[tier].maxHeightPct;

  /** large：従来の wideTemplate と同式。small / medium は tiers の補正のみ */
  const commentMaxHeightPct = isLarge ? "24%" : DIARY_PREVIEW_TIER_COMMENT[tier].maxHeightPct;

  const commentFontSize = isLarge
    ? `clamp(13px, max(2.45cqw, 1.85cqh), 17px)`
    : DIARY_PREVIEW_TIER_COMMENT[tier].fontSize;
  const commentLineHeight = isLarge ? "1.32" : DIARY_PREVIEW_TIER_COMMENT[tier].lineHeight;

  const commentInnerSurfaceClass = isLarge
    ? DIARY_PREVIEW_LARGE_COMMENT_INNER_SURFACE_CLASS
    : DIARY_PREVIEW_TIER_COMMENT[tier].innerSurfaceClass;

  const dateRowFontSize = isLarge
    ? `clamp(10.5px, min(1.52cqw, 2.08cqh), 13px)`
    : DIARY_PREVIEW_TIER_DATE_ROW[tier].fontSize;

  const numberFontSize = isLarge
    ? `clamp(11px, max(2.08cqw, 1.55cqh), 15px)`
    : DIARY_PREVIEW_TIER_NUMBER[tier].fontSize;

  const numberCenterNudge = isLarge
    ? "translate(-50%, -50%) translate(-0.85px, -0.85px)"
    : DIARY_PREVIEW_TIER_NUMBER[tier].centerNudge;

  const bodyScrollbarClasses =
    bodyScrollAff?.rail === true
      ? "[scrollbar-width:thin] [scrollbar-color:rgba(120,113,108,0.42)_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-stone-400/45"
      : "";

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm sm:p-4">
      <h3 className="text-sm font-semibold text-stone-800">製本イメージ（本文ページ）</h3>
      <p className="mt-1 text-xs text-stone-500">
        選んだデザインに入力内容を自動で流し込んだ表示です。
      </p>
      <p className="mt-1 text-[11px] leading-snug text-stone-500 sm:hidden">
        スマホでは文字サイズ設定などで見え方が変わることがあります。枠はレイアウトの目安です。
      </p>
      <div className="mt-3">
        <div
          ref={templateShellRef}
          className="relative mx-auto w-full max-w-full overflow-hidden rounded-lg border border-stone-200 bg-stone-50 [container-type:inline-size] [-webkit-text-size-adjust:100%] [text-size-adjust:100%]"
          style={{
            aspectRatio: `${templateSize.width} / ${templateSize.height}`,
            maxWidth: PREVIEW_SHELL_MAX_WIDTH_PX,
          }}
        >
          <Image
            src={diaryTemplateScreenImageMap[designTheme]}
            alt="日記テンプレート背景"
            fill
            sizes={`(max-width: 640px) 100vw, ${PREVIEW_SHELL_MAX_WIDTH_PX}px`}
            className="object-contain"
          />
          <div
            className="absolute inset-0 antialiased"
            style={{ fontFamily: OVERLAY_FONT_FAMILY }}
          >
            <p
              className="absolute whitespace-nowrap text-stone-700 [font-variant-numeric:tabular-nums]"
              style={{
                left: layout.dateYearLeft,
                top: layout.dateTop,
                fontSize: dateRowFontSize,
                lineHeight: 1,
              }}
            >
              {previewDate.getFullYear()}
            </p>
            <p
              className="absolute whitespace-nowrap text-stone-700"
              style={{
                left: layout.dateMonthLeft,
                top: layout.dateTop,
                fontSize: dateRowFontSize,
                lineHeight: 1,
              }}
            >
              {previewDate.getMonth() + 1}
            </p>
            <p
              className="absolute whitespace-nowrap text-stone-700"
              style={{
                left: layout.dateDayLeft,
                top: layout.dateTop,
                fontSize: dateRowFontSize,
                lineHeight: 1,
              }}
            >
              {previewDate.getDate()}
            </p>
            <p
              className="absolute whitespace-nowrap text-stone-700"
              style={{
                left: layout.dateWeekLeft,
                top: layout.dateTop,
                fontSize: dateRowFontSize,
                lineHeight: 1,
              }}
            >
              {weekdayLabel}
            </p>
            <p
              className="absolute w-[64.8%] whitespace-pre-wrap break-words leading-[1.45] text-stone-700"
              style={{
                left: layout.activityLeft,
                top: layout.activityTop,
                fontSize: "clamp(7px, min(1.88cqw, 2.64cqh), 11px)",
              }}
            >
              {activityLabel.length > 62 ? `${activityLabel.slice(0, 62)}…` : activityLabel}
            </p>
            <p
              className={[
                "absolute overflow-y-auto overscroll-y-contain whitespace-pre-wrap break-words text-stone-700/90 [overflow-wrap:anywhere] touch-pan-y",
                "[-webkit-overflow-scrolling:touch]",
                bodyScrollbarClasses,
                bodyScrollAff?.gradient
                  ? "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:z-[1] after:h-7 after:bg-gradient-to-t after:from-[#f0ebe3]/95 after:via-[#f0ebe3]/25 after:to-transparent after:content-['']"
                  : "",
                bodyScrollAff?.chevron
                  ? "before:pointer-events-none before:absolute before:bottom-0.5 before:left-1/2 before:z-[2] before:-translate-x-1/2 before:text-[9px] before:leading-none before:text-stone-500/90 before:content-['▼']"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{
                left: layout.contentLeft,
                top: layout.contentTop,
                width: layout.contentWidth,
                maxHeight: contentBodyMaxHeightPct,
                fontSize: contentFontSize,
                lineHeight: contentLineHeight,
              }}
            >
              {textPreview}
            </p>
            <div
              className={[
                "absolute box-border overflow-y-auto overscroll-y-contain whitespace-pre-wrap break-words text-stone-700/90 [overflow-wrap:anywhere] touch-pan-y",
                "[-webkit-overflow-scrolling:touch]",
                commentInnerSurfaceClass,
              ].join(" ")}
              style={{
                left: layout.commentLeft,
                top: layout.commentTop,
                width: layout.commentWidth,
                maxHeight: commentMaxHeightPct,
                fontSize: commentFontSize,
                lineHeight: commentLineHeight,
              }}
            >
              {owlComment}
            </div>
            <p
              className="absolute font-semibold text-stone-700 [font-variant-numeric:tabular-nums]"
              style={{
                left: layout.numberLeft,
                top: layout.numberTodayTop,
                fontSize: numberFontSize,
                transform: numberCenterNudge,
              }}
            >
              {displayedNumbers.today}
            </p>
            <p
              className="absolute font-semibold text-stone-700 [font-variant-numeric:tabular-nums]"
              style={{
                left: layout.numberLeft,
                top: layout.numberMonthTop,
                fontSize: numberFontSize,
                transform: numberCenterNudge,
              }}
            >
              {displayedNumbers.month}
            </p>
            <p
              className="absolute font-semibold text-stone-700 [font-variant-numeric:tabular-nums]"
              style={{
                left: layout.numberLeft,
                top: layout.numberYearTop,
                fontSize: numberFontSize,
                transform: numberCenterNudge,
              }}
            >
              {displayedNumbers.year}
            </p>
            <p
              className="absolute font-semibold text-stone-700"
              style={{
                left: layout.numberLeft,
                top: layout.numberCalmTop,
                fontSize: numberFontSize,
                transform: numberCenterNudge,
              }}
            >
              {moodEmoji}
            </p>
            <div className="absolute left-[52.6%] top-[20.1%] w-[27.2%] aspect-square overflow-hidden rounded-sm">
              {photoDataUrl ? (
                <Image
                  src={photoDataUrl}
                  alt="日記写真プレビュー"
                  fill
                  sizes="200px"
                  unoptimized
                  className="object-contain"
                />
              ) : (
                <div className="h-full w-full bg-[#f8f4ea]/80" aria-hidden />
              )}
            </div>
          </div>
        </div>
      </div>
      <JournalContentLengthAlerts
        contentFontMode={contentFontMode}
        contentLength={trimmedBody.length}
      />
      {!bodyEmpty ? (
        <p className="mt-1.5 text-[11px] leading-relaxed text-stone-500">{PREVIEW_OVERFLOW_HINT_MESSAGE}</p>
      ) : null}
    </section>
  );
}
