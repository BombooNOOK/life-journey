"use client";

import {
  READING_FONT_SIZE_LABELS,
  READING_FONT_SIZES,
  type ReadingFontSize,
} from "@/lib/reading/readingFontSize";

import { useReadingFontSize } from "./ReadingFontSizeContext";

const optionClass = (active: boolean) =>
  [
    "min-h-[40px] flex-1 rounded-lg border px-2 py-2 text-center text-[11px] font-semibold leading-tight transition sm:min-h-[44px] sm:text-xs",
    active
      ? "border-emerald-700 bg-emerald-800 text-white shadow-sm"
      : "border-stone-300/90 bg-white/90 text-stone-700 hover:border-emerald-300 hover:bg-emerald-50/80",
  ].join(" ");

type Props = {
  className?: string;
  /** マイページなど説明付きレイアウト */
  variant?: "compact" | "section";
};

/** 読み物用の文字サイズ切り替え（CTA・見出しは対象外） */
export function ReadingFontSizeControl({ className = "", variant = "compact" }: Props) {
  const { readingFontSize, setReadingFontSize } = useReadingFontSize();

  return (
    <div
      className={["w-full", className].filter(Boolean).join(" ")}
      role="group"
      aria-label="読みやすい文字サイズ"
    >
      {variant === "section" ? (
        <h2 className="text-base font-semibold text-stone-900">表示設定</h2>
      ) : null}
      <p
        className={
          variant === "section"
            ? "mt-2 text-sm text-stone-600 lj-read-desc"
            : "text-center text-[10px] font-medium text-stone-600 sm:text-[11px]"
        }
      >
        読みやすい文字サイズ
      </p>
      <div
        className={
          variant === "section"
            ? "mt-3 flex gap-2"
            : "mt-1.5 flex gap-1.5 sm:mt-2 sm:gap-2"
        }
      >
        {READING_FONT_SIZES.map((size) => (
          <button
            key={size}
            type="button"
            aria-pressed={readingFontSize === size}
            onClick={() => setReadingFontSize(size as ReadingFontSize)}
            className={optionClass(readingFontSize === size)}
          >
            {READING_FONT_SIZE_LABELS[size]}
          </button>
        ))}
      </div>
      {variant === "section" ? (
        <p className="mt-2 lj-read-caption text-stone-500">
          現在：
          {READING_FONT_SIZE_LABELS[readingFontSize]}
          。日記本文や説明文など、読む部分に反映されます。製本イメージは変わりません。
        </p>
      ) : null}
    </div>
  );
}
