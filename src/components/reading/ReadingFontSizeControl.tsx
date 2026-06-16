"use client";

import {
  READING_FONT_SIZE_LABELS,
  READING_FONT_SIZES,
  type ReadingFontSize,
} from "@/lib/reading/readingFontSize";

import { useReadingFontSize } from "./ReadingFontSizeContext";

type Props = {
  className?: string;
  /** マイページなど説明付きレイアウト */
  variant?: "hero" | "section";
};

function heroOptionClass(active: boolean): string {
  return [
    "shrink-0 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] leading-none transition sm:text-[11px]",
    active
      ? "bg-emerald-100/95 font-semibold text-emerald-900 ring-1 ring-emerald-300/80"
      : "font-medium text-stone-600 hover:text-emerald-800 hover:underline hover:underline-offset-2",
  ].join(" ");
}

function sectionOptionClass(active: boolean): string {
  return [
    "min-h-[40px] flex-1 rounded-lg border px-2 py-2 text-center text-[11px] font-semibold leading-tight transition sm:min-h-[44px] sm:text-xs",
    active
      ? "border-emerald-700 bg-emerald-800 text-white shadow-sm"
      : "border-stone-300/90 bg-white/90 text-stone-700 hover:border-emerald-300 hover:bg-emerald-50/80",
  ].join(" ");
}

/** 読み物用の文字サイズ切り替え（CTA・見出しは対象外） */
export function ReadingFontSizeControl({ className = "", variant = "hero" }: Props) {
  const { readingFontSize, setReadingFontSize } = useReadingFontSize();

  if (variant === "section") {
    return (
      <div
        className={["w-full", className].filter(Boolean).join(" ")}
        role="group"
        aria-label="文字の大きさ"
      >
        <h2 className="text-base font-semibold text-stone-900">表示設定</h2>
        <p className="lj-read-desc mt-2 text-sm text-stone-600">文字の大きさ</p>
        <div className="mt-3 flex gap-2">
          {READING_FONT_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              aria-pressed={readingFontSize === size}
              onClick={() => setReadingFontSize(size as ReadingFontSize)}
              className={sectionOptionClass(readingFontSize === size)}
            >
              {READING_FONT_SIZE_LABELS[size]}
            </button>
          ))}
        </div>
        <p className="lj-read-caption mt-2 text-stone-500">
          現在：
          {READING_FONT_SIZE_LABELS[readingFontSize]}
          。日記本文や説明文など、読む部分に反映されます。製本イメージは変わりません。
        </p>
      </div>
    );
  }

  return (
    <div
      className={["w-full", className].filter(Boolean).join(" ")}
      role="group"
      aria-label="文字の大きさ"
    >
      <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-[10px] leading-none sm:text-[11px]">
        <span className="shrink-0 font-medium text-stone-600">文字の大きさ</span>
        {READING_FONT_SIZES.map((size, index) => (
          <span key={size} className="inline-flex items-center gap-1">
            {index > 0 ? (
              <span className="select-none text-stone-300" aria-hidden>
                ｜
              </span>
            ) : null}
            <button
              type="button"
              aria-pressed={readingFontSize === size}
              onClick={() => setReadingFontSize(size as ReadingFontSize)}
              className={heroOptionClass(readingFontSize === size)}
            >
              {READING_FONT_SIZE_LABELS[size]}
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
