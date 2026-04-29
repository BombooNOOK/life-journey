"use client";

import Image from "next/image";
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

const TEMPLATE_SIZE_MAP: Record<DiaryDesignId, { width: number; height: number }> = {
  cute: { width: 723, height: 1024 },
  simple: { width: 724, height: 1024 },
};

const TEMPLATE_LAYOUT_MAP: Record<
  DiaryDesignId,
  {
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
  }
> = {
  cute: {
    dateYearLeft: "30.4%",
    dateMonthLeft: "44.1%",
    dateDayLeft: "51.6%",
    dateWeekLeft: "64.5%",
    dateTop: "11.15%",
    moodLeft: "20.3%",
    moodTop: "35.2%",
    activityLeft: "19.1%",
    activityTop: "48.15%",
    contentLeft: "13.15%",
    contentTop: "58.9%",
    contentWidth: "72.8%",
    commentLeft: "12.7%",
    commentTop: "85.85%",
    commentWidth: "58.8%",
    commentMaxHeight: "9.2%",
    numberLeft: "36.0%",
    numberTodayTop: "19.5%",
    numberMonthTop: "24.9%",
    numberYearTop: "30.8%",
    numberCalmTop: "36.6%",
  },
  simple: {
    dateYearLeft: "30.5%",
    dateMonthLeft: "44.3%",
    dateDayLeft: "51.85%",
    dateWeekLeft: "64.8%",
    dateTop: "11.45%",
    moodLeft: "20.35%",
    moodTop: "35.65%",
    activityLeft: "16.95%",
    activityTop: "46.45%",
    contentLeft: "13.2%",
    contentTop: "53.65%",
    contentWidth: "72.8%",
    commentLeft: "9.15%",
    commentTop: "80.45%",
    commentWidth: "62.2%",
    commentMaxHeight: "16.4%",
    numberLeft: "36.1%",
    numberTodayTop: "19.65%",
    numberMonthTop: "25.05%",
    numberYearTop: "30.95%",
    numberCalmTop: "36.65%",
  },
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
  const templateSize = TEMPLATE_SIZE_MAP[designTheme];
  const layout = TEMPLATE_LAYOUT_MAP[designTheme];
  const weekdayLabel = ["日", "月", "火", "水", "木", "金", "土"][previewDate.getDay()];
  const displayedNumbers = diaryNumbers ?? { today: "-", month: "-", year: "-", calmness: "-" };
  const safeContentFontScale = Math.max(0.7, Math.min(1.2, contentFontScale));
  const contentFontSize = `clamp(${(10 * safeContentFontScale).toFixed(2)}px, ${(1.35 * safeContentFontScale).toFixed(3)}vw, ${(13 * safeContentFontScale).toFixed(2)}px)`;
  // テンプレの罫線間隔に寄せる（simple は新レイアウトに合わせてややタイトめ）
  const baseContentLineHeight = 1.95 * (1 / Math.max(safeContentFontScale, 0.85));
  const contentLineHeight =
    designTheme === "simple"
      ? (baseContentLineHeight * 0.97).toFixed(3)
      : baseContentLineHeight.toFixed(3);
  // simple: コメント欄は5行前後・Macでもはみ出しにくいようやや小さめ＋行間は枠内に収まる値
  const commentFontSize =
    designTheme === "simple"
      ? "clamp(8px, 1.05vw, 11px)"
      : "clamp(10px, 1.35vw, 13px)";
  const commentLineHeight = designTheme === "simple" ? "1.62" : "1.9";

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm sm:p-4">
      <h3 className="text-sm font-semibold text-stone-800">製本イメージ（本文ページ）</h3>
      <p className="mt-1 text-xs text-stone-500">
        選んだデザインに入力内容を自動で流し込んだ表示です。
      </p>
      <div className="mt-3">
        <div
          className="relative mx-auto w-full max-w-[540px] overflow-hidden rounded-lg border border-stone-200 bg-stone-50"
          style={{ aspectRatio: `${templateSize.width} / ${templateSize.height}` }}
        >
          <Image
            src={diaryTemplateScreenImageMap[designTheme]}
            alt="日記テンプレート背景"
            fill
            sizes="(max-width: 640px) 100vw, 540px"
            className="object-contain"
          />
          <div className="absolute inset-0">
            <p
              className="absolute text-[clamp(10px,1.45vw,14px)] text-stone-700"
              style={{ left: layout.dateYearLeft, top: layout.dateTop }}
            >
              {previewDate.getFullYear()}
            </p>
            <p
              className="absolute text-[clamp(10px,1.45vw,14px)] text-stone-700"
              style={{ left: layout.dateMonthLeft, top: layout.dateTop }}
            >
              {previewDate.getMonth() + 1}
            </p>
            <p
              className="absolute text-[clamp(10px,1.45vw,14px)] text-stone-700"
              style={{ left: layout.dateDayLeft, top: layout.dateTop }}
            >
              {previewDate.getDate()}
            </p>
            <p
              className="absolute text-[clamp(10px,1.45vw,14px)] text-stone-700"
              style={{ left: layout.dateWeekLeft, top: layout.dateTop }}
            >
              {weekdayLabel}
            </p>
            <p
              className="absolute w-[64.8%] whitespace-pre-wrap break-words text-[clamp(10px,1.45vw,14px)] leading-[1.5] text-stone-700"
              style={{ left: layout.activityLeft, top: layout.activityTop }}
            >
              {activityLabel.length > 62 ? `${activityLabel.slice(0, 62)}…` : activityLabel}
            </p>
            <p
              className="absolute max-h-[18.6%] overflow-hidden whitespace-pre-wrap break-words text-stone-700/90"
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
              className="absolute m-0 overflow-hidden whitespace-pre-wrap break-words text-stone-700/90"
              style={{
                left: layout.commentLeft,
                top: layout.commentTop,
                width: layout.commentWidth,
                maxHeight: layout.commentMaxHeight,
                fontSize: commentFontSize,
                lineHeight: commentLineHeight,
              }}
            >
              {owlComment.length > 145 ? `${owlComment.slice(0, 145)}…` : owlComment}
            </p>
            <p
              className="absolute -translate-x-1/2 -translate-y-1/2 text-[clamp(10px,1.5vw,16px)] font-semibold text-stone-700"
              style={{ left: layout.numberLeft, top: layout.numberTodayTop }}
            >
              {displayedNumbers.today}
            </p>
            <p
              className="absolute -translate-x-1/2 -translate-y-1/2 text-[clamp(10px,1.5vw,16px)] font-semibold text-stone-700"
              style={{ left: layout.numberLeft, top: layout.numberMonthTop }}
            >
              {displayedNumbers.month}
            </p>
            <p
              className="absolute -translate-x-1/2 -translate-y-1/2 text-[clamp(10px,1.5vw,16px)] font-semibold text-stone-700"
              style={{ left: layout.numberLeft, top: layout.numberYearTop }}
            >
              {displayedNumbers.year}
            </p>
            <p
              className="absolute -translate-x-1/2 -translate-y-1/2 text-[clamp(10px,1.5vw,16px)] font-semibold text-stone-700"
              style={{ left: layout.numberLeft, top: layout.numberCalmTop }}
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
