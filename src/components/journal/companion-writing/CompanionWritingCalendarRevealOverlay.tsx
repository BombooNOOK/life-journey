"use client";

import Image from "next/image";

import { DiaryMonthCalendar, type DiaryMonthCalendarEntry } from "@/components/journal/DiaryMonthCalendar";
import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";
import { guardianColorStyleForName } from "@/lib/journal/guardianColorDisplay";
import {
  COMPANION_WRITING_CALENDAR_GUIDE_TITLE,
  COMPANION_WRITING_CALENDAR_REVEAL_STATUS,
  COMPANION_WRITING_SAVE_LOADING_LABEL,
} from "@/lib/journal/companionWriting/types";
import {
  SAVE_TRANSITION_FOREST_BG_DESKTOP_SRC,
  SAVE_TRANSITION_FOREST_BG_MOBILE_SRC,
} from "@/lib/journal/saveTransitionAssets";

type Props = {
  cursorMonth: Date;
  entries: DiaryMonthCalendarEntry[];
  selectedDay: number | null;
  isFetching?: boolean;
};

const CARD_STYLE = guardianColorStyleForName(null);

export function CompanionWritingCalendarRevealOverlay({
  cursorMonth,
  entries,
  selectedDay,
  isFetching = false,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#f3ebe2] px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={isFetching ? undefined : "companion-calendar-reveal-title"}
      aria-describedby={isFetching ? undefined : "companion-calendar-reveal-status"}
      aria-busy={isFetching}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <Image
          src={SAVE_TRANSITION_FOREST_BG_MOBILE_SRC}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center md:hidden"
          priority
        />
        <Image
          src={SAVE_TRANSITION_FOREST_BG_DESKTOP_SRC}
          alt=""
          fill
          sizes="100vw"
          className="hidden object-cover object-center md:block"
          priority
        />
        <div className="absolute inset-0 bg-[#faf8f5]/10" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div
          className="overflow-hidden rounded-2xl shadow-[0_14px_44px_rgba(80,62,44,0.14)]"
          style={{
            borderWidth: 1.5,
            borderStyle: "solid",
            borderColor: CARD_STYLE.borderColor,
            backgroundColor: CARD_STYLE.backgroundColor,
          }}
        >
          <div className="h-1.5" style={{ backgroundColor: CARD_STYLE.topAccent }} />
          <div className="px-4 pb-5 pt-5 sm:px-5 sm:pb-6 sm:pt-6">
            {isFetching ? (
              <div className="flex flex-col items-center py-4" role="status">
                <OwlLoadingInline
                  label={COMPANION_WRITING_SAVE_LOADING_LABEL}
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

                <div className="mt-4">
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
                  className="mt-4 animate-pulse text-center text-xs text-stone-500"
                  aria-live="polite"
                >
                  {COMPANION_WRITING_CALENDAR_REVEAL_STATUS}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
