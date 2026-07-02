"use client";

import Image from "next/image";

import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";
import { diaryBookCalendarPawprintImagePath } from "@/lib/journal/diaryBookAssets";
import {
  calendarDayKeyFromParts,
  calendarDayKeyInJapan,
  entryDayKeyInJapan,
} from "@/lib/journal/journalNav";

/** 5週/6週どちらでも同じ高さにする（6週分のマスを常に確保） */
const CALENDAR_WEEK_ROWS = 6;
const CALENDAR_CELL_SLOTS = CALENDAR_WEEK_ROWS * 7;

export type DiaryMonthCalendarEntry = {
  id: string;
  createdAt: string;
  companionType: string;
};

type Props = {
  cursorMonth: Date;
  entries: DiaryMonthCalendarEntry[];
  selectedDay: number | null;
  isFetching?: boolean;
  loadingLabel?: string;
  onSelectDay: (day: number) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  /** 伴走完了後の足あと確認：操作不可・月送りなし */
  revealMode?: boolean;
};

const monthNavButtonClass =
  "min-h-[44px] min-w-[44px] rounded-lg text-stone-600 transition duration-150 ease-out hover:bg-white hover:text-stone-900 active:scale-[0.97] active:opacity-75 disabled:pointer-events-none disabled:opacity-40";

function monthLabel(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function buildMonthCells(year: number, monthIndex: number): Array<number | null> {
  const startWeekday = new Date(year, monthIndex, 1).getDay();
  const monthDays = new Date(year, monthIndex + 1, 0).getDate();
  const cells: Array<number | null> = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: monthDays }, (_, i) => i + 1),
  ];
  while (cells.length < CALENDAR_CELL_SLOTS) cells.push(null);
  return cells;
}

export function DiaryMonthCalendar({
  cursorMonth,
  entries,
  selectedDay,
  isFetching = false,
  loadingLabel = "フクロウ先生が日記のあしあとを確認しています…",
  onSelectDay,
  onPrevMonth,
  onNextMonth,
  revealMode = false,
}: Props) {
  const year = cursorMonth.getFullYear();
  const monthIndex = cursorMonth.getMonth();
  const todayKey = calendarDayKeyInJapan(new Date());
  const cells = buildMonthCells(year, monthIndex);

  const daysWithEntry = new Set<number>();
  const entryCountByDay = new Map<number, number>();
  for (const entry of entries) {
    const key = entryDayKeyInJapan(entry.createdAt);
    const expectedPrefix = `${year}-${String(monthIndex + 1).padStart(2, "0")}-`;
    if (!key.startsWith(expectedPrefix)) continue;
    const day = Number(key.slice(-2));
    if (!Number.isFinite(day)) continue;
    daysWithEntry.add(day);
    entryCountByDay.set(day, (entryCountByDay.get(day) ?? 0) + 1);
  }

  return (
    <div
      className={[
        "rounded-2xl border border-emerald-100 bg-white shadow-sm",
        revealMode ? "p-3 sm:p-5" : "p-2.5 sm:p-4",
      ].join(" ")}
      aria-busy={isFetching}
    >
      <div className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50/80 px-2 py-2">
        {revealMode ? (
          <div className="w-11" aria-hidden />
        ) : (
          <button
            type="button"
            onClick={onPrevMonth}
            disabled={isFetching}
            aria-busy={isFetching}
            className={monthNavButtonClass}
            aria-label="前の月"
          >
            ←
          </button>
        )}
        <p
          className={`text-sm font-semibold text-stone-800 transition-opacity duration-150 ease-out ${
            isFetching ? "opacity-70" : "opacity-100"
          } ${revealMode ? "text-base" : ""}`}
        >
          {monthLabel(cursorMonth)}
        </p>
        {revealMode ? (
          <div className="w-11" aria-hidden />
        ) : (
          <button
            type="button"
            onClick={onNextMonth}
            disabled={isFetching}
            aria-busy={isFetching}
            className={monthNavButtonClass}
            aria-label="次の月"
          >
            →
          </button>
        )}
      </div>

      <div className="relative mt-3">
      <div
        className={`transition-opacity duration-150 ease-out ${
          isFetching ? "opacity-[0.55]" : "opacity-100"
        }`}
      >
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-stone-500">
          {["日", "月", "火", "水", "木", "金", "土"].map((w) => (
            <div key={w} className="py-1 font-medium">
              {w}
            </div>
          ))}
        </div>
        <div
          className="mt-1 grid min-h-[18.5rem] grid-cols-7 gap-1 sm:min-h-[19.25rem]"
          style={{ gridTemplateRows: `repeat(${CALENDAR_WEEK_ROWS}, minmax(2.85rem, 1fr))` }}
        >
          {cells.map((day, idx) => {
            if (day === null) {
              return (
                <div
                  key={`blank-${idx}`}
                  className="min-h-[2.75rem] rounded-lg border border-transparent"
                  aria-hidden
                />
              );
            }
            const dayKey = calendarDayKeyFromParts(year, monthIndex, day);
            const isToday = dayKey === todayKey;
            const hasEntry = daysWithEntry.has(day);
            const isSelected = selectedDay === day;
            const count = entryCountByDay.get(day) ?? 0;

            const todayLabelBandClass =
              "w-full shrink-0 border-b border-[#C99A2E]/90 bg-[#D8A93A] py-px text-center text-[9px] font-semibold leading-tight tracking-wide text-white sm:text-[10px]";

            return (
              <button
                key={`day-${day}`}
                type="button"
                disabled={isFetching || revealMode}
                onClick={() => onSelectDay(day)}
                className={[
                  "relative flex min-h-[2.85rem] flex-col overflow-hidden rounded-lg border text-xs transition-colors duration-150 outline-none ring-0",
                  "focus-visible:outline-2 focus-visible:outline-offset-1",
                  isSelected
                    ? "border-2 border-emerald-700 bg-emerald-50/90 focus-visible:outline-emerald-700"
                    : isToday
                      ? "border-2 border-[#E7C66A] bg-amber-50/50 hover:border-[#D8A93A] hover:bg-amber-50/70 focus-visible:outline-[#D8A93A]"
                      : "border-stone-100 bg-stone-50/90 hover:border-emerald-200 hover:bg-emerald-50/50 focus-visible:outline-stone-400",
                ].join(" ")}
                aria-label={`${day}日${hasEntry ? `・日記${count}件` : ""}${isToday ? "・今日" : ""}`}
                aria-pressed={isSelected}
              >
                {isToday ? (
                  <span className={todayLabelBandClass} aria-hidden>
                    今日
                  </span>
                ) : null}
                <span
                  className={[
                    "flex w-full flex-col items-center justify-center",
                    isToday ? "min-h-0 flex-1 py-0.5" : "min-h-[2.75rem]",
                  ].join(" ")}
                >
                  <span className="font-medium leading-none text-stone-800">{day}</span>
                  {hasEntry ? (
                    <span className="mt-0.5 flex items-center gap-0.5 leading-none" aria-hidden>
                      <Image
                        src={diaryBookCalendarPawprintImagePath()}
                        alt=""
                        width={14}
                        height={14}
                        className="object-contain opacity-85"
                        unoptimized
                      />
                      {count > 1 ? (
                        <span className="tabular-nums text-[9px] text-emerald-700/90">
                          +{count - 1}
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    <span className="mt-1 h-1.5 w-1.5" aria-hidden />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {isFetching && !revealMode ? (
        <div
          className="pointer-events-auto absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/45 backdrop-blur-[1px]"
          aria-hidden
        >
          <div className="rounded-xl border border-emerald-100/90 bg-white/95 px-3 py-2.5 shadow-sm sm:px-4">
            <OwlLoadingInline label={loadingLabel} size="sm" className="text-xs text-stone-700" />
          </div>
        </div>
      ) : null}
      </div>
      <p className="mt-1.5 hidden min-h-[2.5rem] text-[11px] leading-relaxed text-stone-500 sm:block">
        日記がある日をタップすると、下に一覧が表示されます。「今日」と表示されている日が本日です。
      </p>
    </div>
  );
}
