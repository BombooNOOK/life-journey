"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";

import { DiaryDesignPreview } from "@/components/journal/DiaryDesignPreview";
import { DiaryPreviewBindingAlerts } from "@/components/journal/DiaryPreviewBindingAlerts";
import { BodyPortal, IMMERSIVE_OVERLAY_Z_CLASS } from "@/components/ui/BodyPortal";
import type { DiaryDesignId } from "@/lib/journal/meta";

type PreviewProps = {
  designTheme: DiaryDesignId;
  companionType?: string | null;
  mood: string;
  activity: string;
  content: string;
  comment?: string | null;
  photoDataUrl?: string | null;
  photoSrc?: string | null;
  previewDate: Date;
  diaryNumbers?: {
    today: number;
    month: number;
    year: number;
    calmness: number;
  };
  contentFontMode?: string | null;
  /** false のとき未鑑定プロフィール向け案内をプレビューに表示 */
  kanteiOrderExists?: boolean;
};

type Props = PreviewProps & {
  returnTo: string | null;
  returnHomeLabel: string;
};

/** スマホ：日記ページのみ全画面表示。PC はカード付きプレビュー（724×1024 固定 + scale のみ）。 */
export function JournalPreviewSpread({ returnTo, returnHomeLabel, ...preview }: Props) {
  const [mobileFocus, setMobileFocus] = useState(false);

  useEffect(() => {
    if (!mobileFocus) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileFocus]);

  const closeFullscreen = () => setMobileFocus(false);

  return (
    <>
      <div className="sm:hidden space-y-3">
        <button
          type="button"
          className="w-full cursor-zoom-in rounded-lg border border-dashed border-stone-200 bg-stone-50/50 p-2 text-left active:bg-stone-100/80"
          onClick={() => setMobileFocus(true)}
          aria-label="日記ページを全画面で見る"
        >
          <div className="relative mx-auto aspect-[724/1024] w-full max-w-md overflow-hidden">
            <div className="absolute inset-0">
              <DiaryDesignPreview
                {...preview}
                variant="page"
                pageFitMode="width"
                showBindingAlerts={false}
              />
            </div>
          </div>
        </button>
        <DiaryPreviewBindingAlerts
          {...preview}
          className="mb-2 px-1"
        />
        <p className="text-center text-[11px] text-stone-500">
          ページをタップすると全画面で見られます
        </p>
      </div>
      <div className="hidden sm:block">
        <DiaryDesignPreview {...preview} variant="card" />
      </div>

      {mobileFocus ? (
        <BodyPortal>
          <div
            className={`fixed inset-0 ${IMMERSIVE_OVERLAY_Z_CLASS} flex flex-col bg-[#f7f4ee] sm:hidden`}
            role="dialog"
            aria-modal="true"
            aria-label="日記プレビュー全画面"
          >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-stone-200/90 bg-[#faf8f5]/95 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
              <button
                type="button"
                onClick={closeFullscreen}
                className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-800 transition active:scale-[0.98] active:opacity-80"
              >
                戻る
              </button>
              {returnTo ? (
                <Link
                  href={returnTo}
                  className="max-w-[58%] truncate rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs font-medium text-emerald-950"
                >
                  {returnHomeLabel}
                </Link>
              ) : null}
            </div>
            <div
              className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain pb-[max(1rem,env(safe-area-inset-bottom))] [-webkit-overflow-scrolling:touch]"
              onClick={closeFullscreen}
              role="presentation"
            >
              <DiaryDesignPreview
                {...preview}
                variant="page"
                pageFitMode="fullscreen"
                isolatePointerEvents
                scaledClassName="w-full"
              />
            </div>
            {returnTo ? (
              <div className="relative z-[2] shrink-0 border-t border-stone-200/90 bg-[#faf8f5]/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
                <Link
                  href={returnTo}
                  className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 text-sm font-medium text-emerald-950"
                >
                  {returnHomeLabel}
                </Link>
              </div>
            ) : null}
          </div>
        </BodyPortal>
      ) : null}
    </>
  );
}
