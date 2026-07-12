"use client";

import {
  LJD_DIARY_WRITING_GUIDE_CALENDAR_PREVIEW_LABEL,
  LJD_DIARY_WRITING_GUIDE_WRITE_SELECTED_BUTTON,
  LJD_DIARY_WRITING_GUIDE_WRITE_TODAY_BUTTON,
} from "@/lib/help/ljdDiaryWritingGuideCopy";

const writeButtonBase =
  "flex min-h-[40px] w-full items-center justify-center rounded-xl px-3 py-2 text-center text-xs font-semibold shadow-sm sm:min-h-[42px] sm:text-sm";

/** 案内所用：カレンダーの今日（黄）・選択日（緑）と書くボタンの見た目プレビュー（操作不可） */
export function LjdDiaryWritingGuideCalendarPreview() {
  return (
    <figure className="mx-auto max-w-md rounded-xl border border-stone-200/90 bg-[#faf8f4] p-3 sm:p-4">
      <figcaption className="mb-3 text-xs font-medium text-stone-500">
        {LJD_DIARY_WRITING_GUIDE_CALENDAR_PREVIEW_LABEL}
      </figcaption>
      <div className="pointer-events-none space-y-3" aria-hidden>
        <div className="rounded-2xl border border-emerald-100 bg-white p-2.5 shadow-sm sm:p-3">
          <p className="text-center text-xs font-semibold text-stone-800">2026年7月</p>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {[null, null, 1, 2, 3, 4, 5].map((day, index) =>
              day === null ? (
                <div key={`blank-${index}`} className="min-h-[2.5rem]" />
              ) : day === 3 ? (
                <div
                  key={`day-${day}`}
                  className="relative flex min-h-[2.5rem] flex-col overflow-hidden rounded-lg border-2 border-[#E7C66A] bg-amber-50/50 text-xs"
                >
                  <span className="w-full shrink-0 border-b border-[#C99A2E]/90 bg-[#D8A93A] py-px text-center text-[9px] font-semibold text-white">
                    今日
                  </span>
                  <span className="flex flex-1 items-center justify-center font-medium text-stone-800">
                    {day}
                  </span>
                </div>
              ) : day === 1 ? (
                <div
                  key={`day-${day}`}
                  className="flex min-h-[2.5rem] items-center justify-center rounded-lg border-2 border-emerald-700 bg-emerald-50/90 text-xs font-medium text-stone-800"
                >
                  {day}
                </div>
              ) : (
                <div
                  key={`day-${day}`}
                  className="flex min-h-[2.5rem] items-center justify-center rounded-lg border border-stone-100 bg-stone-50/90 text-xs font-medium text-stone-800"
                >
                  {day}
                </div>
              ),
            )}
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-stone-500 sm:text-[11px]">
            黄色＝今日、緑＝タップして選んだ日
          </p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <span
            className={`${writeButtonBase} border border-[#E7C66A] bg-[#D8A93A] text-white`}
          >
            {LJD_DIARY_WRITING_GUIDE_WRITE_TODAY_BUTTON}
          </span>
          <span
            className={`${writeButtonBase} border border-emerald-300/80 bg-emerald-700 text-white`}
          >
            {LJD_DIARY_WRITING_GUIDE_WRITE_SELECTED_BUTTON}
          </span>
        </div>
      </div>
    </figure>
  );
}
