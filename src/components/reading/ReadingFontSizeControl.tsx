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
  /** section 時の見出し（専用ページでは false） */
  showSectionHeading?: boolean;
  /** 玄関ページなど：ヒーロー帯の文字を少し大きく */
  comfortable?: boolean;
};

function heroOptionClass(active: boolean, comfortable: boolean): string {
  return [
    "shrink-0 whitespace-nowrap rounded-md leading-none transition",
    comfortable ? "px-1.5 py-1" : "px-1 py-0.5",
    active
      ? "bg-[#DDEFE4] font-semibold text-[#0B6B4A] ring-1 ring-[#8DBFA5]"
      : "font-medium text-[#6B6258] hover:text-[#0B6B4A]/85 hover:underline hover:underline-offset-2",
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
export function ReadingFontSizeControl({
  className = "",
  variant = "hero",
  showSectionHeading = true,
  comfortable = false,
}: Props) {
  const { readingFontSize, setReadingFontSize } = useReadingFontSize();

  if (variant === "section") {
    return (
      <div
        className={["w-full", className].filter(Boolean).join(" ")}
        role="group"
        aria-label="文字の大きさ"
      >
        {showSectionHeading ? (
          <h2 className="text-base font-semibold text-stone-900">表示設定</h2>
        ) : null}
        <p className={`lj-read-desc text-sm text-stone-600 ${showSectionHeading ? "mt-2" : ""}`}>文字の大きさ</p>
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

  const heroRootClass = comfortable
    ? "w-full text-[0.75rem] leading-none sm:text-[0.8125rem]"
    : "w-full text-[0.625rem] leading-none";

  return (
    <div
      className={[heroRootClass, className].filter(Boolean).join(" ")}
      role="group"
      aria-label="文字の大きさ"
    >
      <p className="text-center font-medium text-[#6B6258]">文字の大きさ</p>
      <div className={`flex flex-nowrap items-center justify-center gap-x-0 whitespace-nowrap ${comfortable ? "mt-1" : "mt-0.5"}`}>
        {READING_FONT_SIZES.map((size, index) => (
          <span key={size} className="inline-flex shrink-0 items-center">
            {index > 0 ? (
              <span className="select-none px-0.5 text-[#D8D0C6]" aria-hidden>
                ｜
              </span>
            ) : null}
            <button
              type="button"
              aria-pressed={readingFontSize === size}
              onClick={() => setReadingFontSize(size as ReadingFontSize)}
              className={heroOptionClass(readingFontSize === size, comfortable)}
            >
              {READING_FONT_SIZE_LABELS[size]}
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
