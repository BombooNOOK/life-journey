"use client";

import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";
import { DiaryMonthCalendar, type DiaryMonthCalendarEntry } from "@/components/journal/DiaryMonthCalendar";
import {
  COMPANION_WRITING_CALENDAR_REVEAL_STATUS,
} from "@/lib/journal/companionWriting/types";

type Props = {
  cursorMonth: Date;
  entries: DiaryMonthCalendarEntry[];
  selectedDay: number | null;
  isFetching?: boolean;
};

const COMPANION_CALENDAR_REVEAL_LOADING_LABEL =
  "フクロウ先生が日記の足跡を確認しています…";

export function CompanionWritingCalendarRevealOverlay({
  cursorMonth,
  entries,
  selectedDay,
  isFetching = false,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#f8faf4] px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby={isFetching ? undefined : "companion-calendar-reveal-title"}
      aria-describedby={isFetching ? undefined : "companion-calendar-reveal-status"}
      aria-busy={isFetching}
    >
      <div className="flex w-full max-w-md flex-col items-center gap-5">
        {isFetching ? (
          <div className="flex flex-col items-center gap-3 py-6" role="status">
            <OwlLoadingInline
              label={COMPANION_CALENDAR_REVEAL_LOADING_LABEL}
              size="md"
              className="text-sm text-stone-700"
            />
          </div>
        ) : (
          <>
            <p
              id="companion-calendar-reveal-title"
              className="text-center text-sm font-medium text-stone-700"
            >
              ここに、今日のあしあとが残りました
            </p>

            <div className="w-full">
              <DiaryMonthCalendar
                cursorMonth={cursorMonth}
                entries={entries}
                selectedDay={selectedDay}
                isFetching={false}
                revealMode
                onSelectDay={() => {}}
                onPrevMonth={() => {}}
                onNextMonth={() => {}}
              />
            </div>

            <p
              id="companion-calendar-reveal-status"
              className="animate-pulse text-center text-xs text-stone-500"
              aria-live="polite"
            >
              {COMPANION_WRITING_CALENDAR_REVEAL_STATUS}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
