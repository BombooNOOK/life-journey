"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import { getActivityMeta, getMoodMeta, type DiaryDesignId } from "@/lib/journal/meta";
import { diaryTemplateScreenImageMap } from "@/lib/journal/templateAssets";

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
  contentFontScale?: number;
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
  dateTop: "11.45%",
  moodLeft: "20.35%",
  moodTop: "35.65%",
  activityLeft: "16.95%",
  activityTop: "46.45%",
  contentLeft: "13.2%",
  /** 画像の「今日の記録」見出しと本文1行目が被らないよう少し下げる */
  contentTop: "54.35%",
  contentWidth: "72.8%",
  commentLeft: "9.15%",
  /** フクロウ先生コメント（画像の吹き出しに合わせる） */
  commentTop: "78.55%",
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
  contentFontScale = 1,
}: Props) {
  const moodEmoji = getMoodMeta(mood).emoji;
  const activityLabel = getActivityMeta(activity).label;
  const textPreview = content.trim() || "ここに本文が入ります。";
  const owlComment = comment?.trim() || "保存後に「フクロウ先生の読み解き」がここに入ります。";
  const templateSize = TEMPLATE_SIZE;
  const layout = TEMPLATE_LAYOUT;
  const weekdayLabel = ["日", "月", "火", "水", "木", "金", "土"][previewDate.getDay()];
  const displayedNumbers = diaryNumbers ?? { today: "-", month: "-", year: "-", calmness: "-" };
  const safeContentFontScale = Math.max(0.7, Math.min(1.2, contentFontScale));
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
  const [wideTemplate, setWideTemplate] = useState(false);
  useLayoutEffect(() => {
    const el = templateShellRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const apply = (w: number) => setWideTemplate(w >= 440);
    const ro = new ResizeObserver((entries) => {
      apply(entries[0]?.contentRect.width ?? 0);
    });
    ro.observe(el);
    apply(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  /** 広い枠では吹き出し内を縦にも少し多く使う */
  const commentMaxHeightPct = wideTemplate ? "21.6%" : layout.commentMaxHeight;

  /** 狭いコンテナ＝iPhone 想定で踏み過ぎない／広い＝PC では一段はっきり大きく（差が目に見える程度まで） */
  const commentFontSize = wideTemplate
    ? `clamp(11px, max(2.12cqw, 1.58cqh), 14px)`
    : `clamp(7px, min(1.72cqw, 2.35cqh), 9.35px)`;
  const commentLineHeight = wideTemplate ? "1.38" : "1.48";

  /** 日付：スマホは小さめで重なり回避、広い枠では読みやすく */
  const dateRowFontSize = wideTemplate
    ? `clamp(6.75px, min(1.32cqw, 1.85cqh), 8.85px)`
    : `clamp(5.2px, min(1.12cqw, 1.58cqh), 7.1px)`;

  /** 今日の数字〜年の数字・気分：広い枠では一段大きく（スマホは従来どおり抑える） */
  const numberFontSize = wideTemplate
    ? `clamp(8px, min(1.78cqw, 2.48cqh), 12px)`
    : `clamp(7px, min(1.72cqw, 2.42cqh), 11px)`;

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
          className="relative mx-auto w-full max-w-[540px] overflow-hidden rounded-lg border border-stone-200 bg-stone-50 [container-type:inline-size] [-webkit-text-size-adjust:100%] [text-size-adjust:100%]"
          style={{ aspectRatio: `${templateSize.width} / ${templateSize.height}` }}
        >
          <Image
            src={diaryTemplateScreenImageMap[designTheme]}
            alt="日記テンプレート背景"
            fill
            sizes="(max-width: 640px) 100vw, 540px"
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
              className="absolute max-h-[18.6%] overflow-hidden whitespace-pre-wrap break-words text-stone-700/90 [overflow-wrap:anywhere]"
              style={{
                left: layout.contentLeft,
                top: layout.contentTop,
                width: layout.contentWidth,
                fontSize: contentFontSize,
                lineHeight: contentLineHeight,
              }}
            >
              {textPreview.length > 500 ? `${textPreview.slice(0, 500)}…` : textPreview}
            </p>
            <p
              className="absolute m-0 overflow-hidden whitespace-pre-wrap break-words text-stone-700/90 [overflow-wrap:anywhere]"
              style={{
                left: layout.commentLeft,
                top: layout.commentTop,
                width: layout.commentWidth,
                maxHeight: commentMaxHeightPct,
                fontSize: commentFontSize,
                lineHeight: commentLineHeight,
              }}
            >
              {owlComment.length > 145 ? `${owlComment.slice(0, 145)}…` : owlComment}
            </p>
            <p
              className="absolute font-semibold text-stone-700 [font-variant-numeric:tabular-nums]"
              style={{
                left: layout.numberLeft,
                top: layout.numberTodayTop,
                fontSize: numberFontSize,
                transform: "translate(-50%, -50%) translate(-0.5px, -0.5px)",
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
                transform: "translate(-50%, -50%) translate(-0.5px, -0.5px)",
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
                transform: "translate(-50%, -50%) translate(-0.5px, -0.5px)",
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
                transform: "translate(-50%, -50%) translate(-0.5px, -0.5px)",
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
                <div className="flex h-full w-full items-center justify-center bg-[#f8f4ea]/80 text-[11px] text-stone-500">
                  写真
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
