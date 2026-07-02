"use client";

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
      aria-labelledby="companion-calendar-reveal-title"
      aria-describedby="companion-calendar-reveal-status"
    >
      <div className="flex w-full max-w-md flex-col items-center gap-5">
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
            isFetching={isFetching}
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
      </div>
    </div>
  );
}
