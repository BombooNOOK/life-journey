"use client";

import { DiaryMonthCalendar, type DiaryMonthCalendarEntry } from "@/components/journal/DiaryMonthCalendar";
import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";
import { getAppraiserDisplayName } from "@/lib/journal/companionWriting/messages";
import {
  COMPANION_WRITING_CALENDAR_GUIDE_TITLE,
  COMPANION_WRITING_CALENDAR_REVEAL_STATUS,
  companionWritingSaveLoadingLabel,
} from "@/lib/journal/companionWriting/types";
import type { CompanionType } from "@/lib/journal/meta";

type Props = {
  cursorMonth: Date;
  entries: DiaryMonthCalendarEntry[];
  selectedDay: number | null;
  isFetching?: boolean;
  companionType: CompanionType;
};

export function CompanionWritingCalendarRevealOverlay({
  cursorMonth,
  entries,
  selectedDay,
  isFetching = false,
  companionType,
}: Props) {
  const saveLoadingLabel = companionWritingSaveLoadingLabel(
    getAppraiserDisplayName(companionType),
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#faf8f5] px-2 py-6 sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={isFetching ? undefined : "companion-calendar-reveal-title"}
      aria-describedby={isFetching ? undefined : "companion-calendar-reveal-status"}
      aria-busy={isFetching}
    >
      <div className="w-full max-w-3xl space-y-4">
        {isFetching ? (
          <div className="flex flex-col items-center py-8" role="status">
            <OwlLoadingInline
              label={saveLoadingLabel}
              size="md"
              className="text-sm text-stone-700"
            />
          </div>
        ) : (
          <>
            <p
              id="companion-calendar-reveal-title"
              className="text-center text-[15px] font-medium leading-7 tracking-wide text-stone-800"
            >
              {COMPANION_WRITING_CALENDAR_GUIDE_TITLE}
            </p>

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
