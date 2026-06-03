"use client";

import Image from "next/image";

import { diaryCoverImagePath, normalizeDiaryCoverStyle } from "@/lib/journal/coverAssets";
import { diaryBookMonthIndexMoonImagePath } from "@/lib/journal/diaryBookAssets";
import { phraseForMonth, phraseForYear } from "@/lib/journal/diaryPhrases";
import { isEntryIncludedInDiaryBook } from "@/lib/journal/includeInBook";
import { getCompanionStamp, getMoodMeta } from "@/lib/journal/meta";

/** 本棚の年次めくりと共有する最小エントリ形 */
export type BoundDiaryEntry = {
  id: string;
  content: string;
  createdAt: string;
  mood: string;
  activity: string;
  companionType: string;
  designTheme?: string;
  photoDataUrl: string | null;
  generatedComment: string | null;
  includeInBook?: boolean;
  contentFontMode?: string;
  diaryNumbers?: {
    today: number;
    month: number;
    year: number;
    calmness: number;
  };
};

const PAGE_ASPECT = { aspectRatio: "724 / 1024" as const };

/** 日記ブック読書の月カレンダーは常に6週分のマス高さを確保 */
const DIARY_BOOK_READER_WEEK_ROWS = 6;
/** 月インデックス背景 PNG の装飾が載る上部（1024px ページの約1/3） */
const DIARY_BOOK_READER_INDEX_HEADER_HEIGHT_PX = 341;
/** bookReader 月ページの設計高（724×1024） */
const DIARY_BOOK_READER_PAGE_HEIGHT_PX = 1024;
/** ページ下端の余白（ページ高の約5%・下側ブロックの重心を少し上げる） */
const DIARY_BOOK_READER_LOWER_BLOCK_BOTTOM_INSET_PX = Math.round(
  DIARY_BOOK_READER_PAGE_HEIGHT_PX * 0.05,
);
/** タイトル下〜曜日行（前回詰めた分の約半分だけ戻す） */
const DIARY_BOOK_READER_TITLE_TO_CALENDAR_GAP_PX = 72;
/** 月まとめ欄（紙・手帳感の生成り＋淡い森グリーンの枠） */
const DIARY_BOOK_READER_SUMMARY_BG = "#f2f0e8";
const DIARY_BOOK_READER_SUMMARY_BORDER = "#c9d2bc";

function DiaryBookReaderMonthIndexTitle({
  year,
  monthIndex,
}: {
  year: number;
  monthIndex: number;
}) {
  const month = monthIndex + 1;
  return (
    <h2 className="flex flex-col items-center text-center text-stone-800/90">
      <span className="flex items-baseline justify-center font-medium leading-tight tabular-nums">
        <span className="text-[1.5rem] tracking-[0.06em]">{year}</span>
        <span className="ml-2.5 text-[1.125rem] font-normal tracking-[0.28em] text-stone-700/80">
          年
        </span>
      </span>
      <span className="mt-2 flex items-baseline justify-center font-semibold leading-none tabular-nums">
        <span className="text-[2.85rem] tracking-[0.04em]">{month}</span>
        <span className="ml-3 text-[2rem] font-medium tracking-[0.32em] text-stone-800/88">月</span>
      </span>
    </h2>
  );
}

function DiaryBookReaderMonthDayCellBackground({
  day,
  isToday,
}: {
  day: number | null;
  isToday: boolean;
}) {
  if (day === null) {
    return <div className="min-h-0 rounded border border-transparent" aria-hidden />;
  }

  return (
    <div
      className={[
        "h-full min-h-0 rounded border border-stone-100 bg-white/90",
        isToday ? "ring-1 ring-amber-300" : "",
      ].join(" ")}
    />
  );
}

function DiaryBookReaderMonthDayCellText({
  day,
  hasEntry,
  stampEntry,
  extraEntryCount,
}: {
  day: number | null;
  hasEntry: boolean;
  stampEntry: BoundDiaryEntry | null;
  extraEntryCount: number;
}) {
  if (day === null) {
    return <div className="min-h-0" aria-hidden />;
  }

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr_auto] text-stone-700">
      <span className="pt-1.5 text-center text-[15px] font-medium leading-none tabular-nums">
        {day}
      </span>
      <div className="flex min-h-[1.1rem] items-center justify-center">
        {hasEntry && stampEntry ? (
          <span className="text-[17px] leading-none" title="記録あり">
            {getCompanionStamp(stampEntry.companionType)}
          </span>
        ) : null}
      </div>
      <span className="pb-1 text-center text-[10px] font-medium leading-none tabular-nums text-emerald-800/90 sm:text-[11px]">
        {extraEntryCount > 0 ? `+${extraEntryCount}` : "\u00a0"}
      </span>
    </div>
  );
}

function BookPageFrame({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm sm:p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-stone-500">{eyebrow}</p>
      <h3 className="mt-0.5 text-sm font-semibold text-stone-900">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function DiaryBoundFrontCover({
  year,
  coverTheme,
  displayTitle,
}: {
  year: number;
  coverTheme?: string;
  displayTitle?: string | null;
}) {
  const coverStyle = normalizeDiaryCoverStyle(coverTheme);
  const coverSrc = diaryCoverImagePath(coverStyle, "owl");
  const customTitle = displayTitle?.trim();
  return (
    <BookPageFrame eyebrow="製本イメージ" title={`表紙 · ${year}年`}>
      <div
        className="relative mx-auto w-full max-w-[540px] overflow-hidden rounded-lg border border-stone-200 bg-[#f7f4ee] shadow-inner"
        style={PAGE_ASPECT}
      >
        <Image
          src={coverSrc}
          alt={`${year}年の日記・表紙（${coverStyle === "kireime" ? "きれいめ" : "シンプル"}）`}
          fill
          className="object-cover"
          sizes="540px"
          priority
        />
      </div>
      {customTitle ? (
        <p className="mt-2 text-center text-sm text-stone-600">
          本の名前: <span className="font-medium text-stone-800">{customTitle}</span>
        </p>
      ) : null}
    </BookPageFrame>
  );
}

export function DiaryBoundBackCover({ year }: { year: number }) {
  return (
    <BookPageFrame eyebrow="製本イメージ" title={`裏表紙 · ${year}年`}>
      <div
        className="relative mx-auto flex w-full max-w-[540px] flex-col items-center justify-center overflow-hidden rounded-lg border border-stone-300 bg-gradient-to-br from-stone-100 to-emerald-50/50 px-8 text-center shadow-inner"
        style={PAGE_ASPECT}
      >
        <p className="text-sm font-medium text-stone-700">おつかれさまでした</p>
        <p className="mt-3 text-xs leading-relaxed text-stone-600">
          {year}年の記録が、あなたの歩みのひとつとして残ります。
        </p>
        <p className="mt-8 text-[11px] text-stone-500">Life Journey Diary · 製本想定レイアウト</p>
      </div>
    </BookPageFrame>
  );
}

function entriesInMonth(entries: BoundDiaryEntry[], year: number, monthIndex: number): BoundDiaryEntry[] {
  return entries.filter((e) => {
    const d = new Date(e.createdAt);
    return d.getFullYear() === year && d.getMonth() === monthIndex;
  });
}

export function DiaryBoundMonthCalendarPage({
  year,
  monthIndex,
  entries,
  bookReader = false,
}: {
  year: number;
  monthIndex: number;
  entries: BoundDiaryEntry[];
  /** 日記ブック読書用（724×1024 フルページ・外枠なし） */
  bookReader?: boolean;
}) {
  const monthEntriesAll = entriesInMonth(entries, year, monthIndex);
  const monthEntries = bookReader
    ? monthEntriesAll.filter(isEntryIncludedInDiaryBook)
    : monthEntriesAll;
  const daysWithEntry = new Set<number>();
  const entryCountByDay = new Map<number, number>();
  const latestByDay = new Map<number, BoundDiaryEntry>();
  for (const entry of monthEntries) {
    const d = new Date(entry.createdAt);
    const day = d.getDate();
    daysWithEntry.add(day);
    entryCountByDay.set(day, (entryCountByDay.get(day) ?? 0) + 1);
    if (!latestByDay.has(day)) latestByDay.set(day, entry);
  }
  const moodCount = new Map<string, number>();
  for (const entry of monthEntries) {
    moodCount.set(entry.mood, (moodCount.get(entry.mood) ?? 0) + 1);
  }
  let topMoodId = "calm";
  let topCount = -1;
  for (const [k, v] of moodCount.entries()) {
    if (v > topCount) {
      topMoodId = k;
      topCount = v;
    }
  }
  const topMood =
    bookReader && monthEntries.length === 0
      ? { emoji: "", label: "まだ記録がありません" }
      : getMoodMeta(topMoodId);

  const startWeekday = new Date(year, monthIndex, 1).getDay();
  const monthDays = new Date(year, monthIndex + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === monthIndex;

  const cells: Array<number | null> = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: monthDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const bookReaderCells: Array<number | null> = [...cells];
  while (bookReaderCells.length < DIARY_BOOK_READER_WEEK_ROWS * 7) {
    bookReaderCells.push(null);
  }

  const label = `${year}年${monthIndex + 1}月`;

  const calendarBody = (
      <div
        className={
          bookReader
            ? "relative flex h-full w-full flex-col overflow-hidden bg-[#fdfaf4]"
            : "mx-auto flex w-full max-w-[540px] flex-col gap-3 overflow-hidden rounded-lg border border-stone-200 bg-[#fdfaf4] p-4 shadow-inner"
        }
        style={bookReader ? { width: 724, height: 1024 } : PAGE_ASPECT}
      >
        {bookReader ? (
          <>
            {/* 最下層: カレンダー枠・集計ボックス背景（クリーム地は親の bg） */}
            <div
              className="pointer-events-none absolute inset-0 z-0 flex h-full min-h-0 flex-col"
              aria-hidden
            >
              <div
                className="shrink-0"
                style={{ height: DIARY_BOOK_READER_INDEX_HEADER_HEIGHT_PX }}
              />
              <div
                className="shrink-0"
                style={{ height: DIARY_BOOK_READER_TITLE_TO_CALENDAR_GAP_PX }}
                aria-hidden
              />
              <div className="flex shrink-0 flex-col gap-3 px-4">
                <div className="flex min-h-0 flex-col gap-2.5">
                  <div className="grid shrink-0 grid-cols-7 gap-1.5 text-center text-xs invisible">
                    {["日", "月", "火", "水", "木", "金", "土"].map((w) => (
                      <div key={w} className="py-0.5">
                        {w}
                      </div>
                    ))}
                  </div>
                  <div
                    className="grid min-h-[24rem] w-full max-h-[36rem] grid-cols-7 gap-1.5"
                    style={{
                      gridTemplateRows: `repeat(${DIARY_BOOK_READER_WEEK_ROWS}, minmax(0, 1fr))`,
                    }}
                  >
                    {bookReaderCells.map((day, idx) => {
                      const isToday =
                        day !== null && isCurrentMonth && day === today.getDate();
                      return (
                        <DiaryBookReaderMonthDayCellBackground
                          key={`br-bg-${idx}-${day ?? "x"}`}
                          day={day}
                          isToday={isToday}
                        />
                      );
                    })}
                  </div>
                </div>
                <div
                  className="shrink-0 rounded-lg border px-3 py-2.5 text-base leading-relaxed invisible"
                  style={{
                    borderColor: DIARY_BOOK_READER_SUMMARY_BORDER,
                    backgroundColor: DIARY_BOOK_READER_SUMMARY_BG,
                  }}
                >
                  <p>
                    記録した日:{" "}
                    <span className="font-semibold">{daysWithEntry.size}</span> 日
                    {monthEntries.length > daysWithEntry.size ? (
                      <span>（同日に複数件あり）</span>
                    ) : null}
                  </p>
                  <p className="mt-1.5">
                    よく出た気分:{" "}
                    <span className="font-semibold">
                      {topMood.emoji} {topMood.label}
                    </span>
                  </p>
                  <p className="mt-1.5">{phraseForMonth(monthEntries.length, topMoodId)}</p>
                </div>
              </div>
              <div className="min-h-0 flex-1" aria-hidden />
              <div
                className="shrink-0"
                style={{ height: DIARY_BOOK_READER_LOWER_BLOCK_BOTTOM_INSET_PX }}
                aria-hidden
              />
            </div>
            {/* 中間層: 月シルエット（透明 PNG・ページ全体に配置して下部が切れないように） */}
            <div
              className="pointer-events-none absolute inset-0 z-10"
              style={{
                backgroundImage: `url(${diaryBookMonthIndexMoonImagePath()})`,
                backgroundSize: "100% auto",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
              }}
              aria-hidden
            />
            {/* 最上層: タイトル・曜日・日付・スタンプ・集計テキスト */}
            <div className="relative z-20 flex h-full min-h-0 flex-col">
              <div
                className="relative flex shrink-0 flex-col items-center px-6"
                style={{
                  height: DIARY_BOOK_READER_INDEX_HEADER_HEIGHT_PX,
                  paddingTop: 178,
                }}
                aria-label={`${label}の扉`}
              >
                <DiaryBookReaderMonthIndexTitle year={year} monthIndex={monthIndex} />
              </div>
              <div
                className="shrink-0"
                style={{ height: DIARY_BOOK_READER_TITLE_TO_CALENDAR_GAP_PX }}
                aria-hidden
              />
              <div className="flex shrink-0 flex-col gap-3 px-4">
                <div className="flex min-h-0 flex-col gap-2.5">
                  <div className="grid shrink-0 grid-cols-7 gap-1.5 text-center text-xs text-stone-500">
                    {["日", "月", "火", "水", "木", "金", "土"].map((w) => (
                      <div key={w} className="py-0.5">
                        {w}
                      </div>
                    ))}
                  </div>
                  <div
                    className="grid min-h-[24rem] w-full max-h-[36rem] grid-cols-7 gap-1.5"
                    style={{
                      gridTemplateRows: `repeat(${DIARY_BOOK_READER_WEEK_ROWS}, minmax(0, 1fr))`,
                    }}
                  >
                    {bookReaderCells.map((day, idx) => {
                      const hasEntry = day !== null && daysWithEntry.has(day);
                      const stampEntry = day !== null ? latestByDay.get(day) ?? null : null;
                      const entryCount = day !== null ? (entryCountByDay.get(day) ?? 0) : 0;
                      const extraEntryCount = entryCount > 1 ? entryCount - 1 : 0;
                      return (
                        <DiaryBookReaderMonthDayCellText
                          key={`br-txt-${idx}-${day ?? "x"}`}
                          day={day}
                          hasEntry={hasEntry}
                          stampEntry={stampEntry}
                          extraEntryCount={extraEntryCount}
                        />
                      );
                    })}
                  </div>
                </div>
                <div
                  className="shrink-0 rounded-lg border px-3 py-3 text-base leading-relaxed text-[#5a5348]"
                  style={{
                    borderColor: DIARY_BOOK_READER_SUMMARY_BORDER,
                    backgroundColor: DIARY_BOOK_READER_SUMMARY_BG,
                  }}
                >
                  <p>
                    記録した日:{" "}
                    <span className="font-semibold text-[#3f4538]">{daysWithEntry.size}</span> 日
                    {monthEntries.length > daysWithEntry.size ? (
                      <span className="text-[#6b6358]">（同日に複数件あり）</span>
                    ) : null}
                  </p>
                  <p className="mt-2">
                    よく出た気分:{" "}
                    <span className="font-semibold text-[#3f4538]">
                      {topMood.emoji} {topMood.label}
                    </span>
                  </p>
                  <p className="mt-2 text-[#5c554c]">
                    {phraseForMonth(monthEntries.length, topMoodId)}
                  </p>
                </div>
              </div>
              <div className="min-h-0 flex-1" aria-hidden />
              <div
                className="shrink-0"
                style={{ height: DIARY_BOOK_READER_LOWER_BLOCK_BOTTOM_INSET_PX }}
                aria-hidden
              />
            </div>
          </>
        ) : (
          <>
        <p className="text-center text-xs font-semibold text-stone-800">{label}</p>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-stone-500">
            {["日", "月", "火", "水", "木", "金", "土"].map((w) => (
              <div key={w} className="py-0.5">
                {w}
              </div>
            ))}
            {cells.map((day, idx) => {
              const isToday =
                day !== null && isCurrentMonth && day === today.getDate();
              const hasEntry = day !== null && daysWithEntry.has(day);
              const stampEntry = day !== null ? latestByDay.get(day) ?? null : null;
              return (
                <div
                  key={`${idx}-${day ?? "x"}`}
                  className={[
                    "flex min-h-9 flex-col items-center justify-center rounded border text-[10px] leading-tight",
                    day === null ? "border-transparent" : "border-stone-100 bg-white/90 text-stone-700",
                    isToday ? "ring-1 ring-amber-300" : "",
                  ].join(" ")}
                >
                  {day === null ? null : hasEntry && stampEntry ? (
                    <>
                      <span>{day}</span>
                      <span className="text-[11px]" title="記録あり">
                        {getCompanionStamp(stampEntry.companionType)}
                      </span>
                    </>
                  ) : (
                    <span className="text-stone-500">{day}</span>
                  )}
                </div>
              );
            })}
          </div>
        <div className="mt-auto rounded-lg border border-emerald-100 bg-emerald-50/70 px-2 py-2 text-[11px] leading-snug text-stone-700">
          <p>
            記録した日: <span className="font-semibold text-stone-900">{daysWithEntry.size}</span> 日
            {monthEntries.length > daysWithEntry.size ? (
              <span className="text-stone-500">（同日に複数件あり）</span>
            ) : null}
          </p>
          <p className="mt-1">
            よく出た気分:{" "}
            <span className="font-semibold text-stone-900">
              {topMood.emoji} {topMood.label}
            </span>
          </p>
          <p className="mt-1 text-stone-600">{phraseForMonth(monthEntries.length, topMoodId)}</p>
        </div>
          </>
        )}
      </div>
  );

  if (bookReader) return calendarBody;

  return (
    <BookPageFrame eyebrow="製本イメージ · 足跡カレンダー" title={label}>
      {calendarBody}
    </BookPageFrame>
  );
}

function countDistinctLocalDays(entries: BoundDiaryEntry[], year: number): number {
  const keys = new Set<string>();
  for (const e of entries) {
    const d = new Date(e.createdAt);
    if (d.getFullYear() !== year) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    keys.add(key);
  }
  return keys.size;
}

function countMonthsWithEntries(entries: BoundDiaryEntry[], year: number): number {
  const m = new Set<number>();
  for (const e of entries) {
    const d = new Date(e.createdAt);
    if (d.getFullYear() === year) m.add(d.getMonth());
  }
  return m.size;
}

export function DiaryBoundReflectionPage({ year, entries }: { year: number; entries: BoundDiaryEntry[] }) {
  const inYear = entries.filter((e) => new Date(e.createdAt).getFullYear() === year);
  const distinctDays = countDistinctLocalDays(entries, year);
  const monthsTouched = countMonthsWithEntries(entries, year);
  const moodCount = new Map<string, number>();
  for (const entry of inYear) {
    moodCount.set(entry.mood, (moodCount.get(entry.mood) ?? 0) + 1);
  }
  let topMoodId = "calm";
  let topCount = -1;
  for (const [k, v] of moodCount.entries()) {
    if (v > topCount) {
      topMoodId = k;
      topCount = v;
    }
  }
  const topMood = getMoodMeta(topMoodId);
  const sorted = [...inYear].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  return (
    <BookPageFrame eyebrow="製本イメージ" title={`${year}年の振り返り`}>
      <div
        className="mx-auto flex w-full max-w-[540px] flex-col justify-between gap-4 overflow-hidden rounded-lg border border-stone-200 bg-white p-5 shadow-inner"
        style={PAGE_ASPECT}
      >
        <div className="space-y-3 text-sm text-stone-700">
          <p>
            記録の件数: <span className="font-semibold text-stone-900">{inYear.length}</span> 件
          </p>
          <p>
            記録のあった日: <span className="font-semibold text-stone-900">{distinctDays}</span> 日
            （{monthsTouched} か月にまたがって残っています）
          </p>
          {first && last ? (
            <p className="text-xs text-stone-600">
              期間の目安: {first.createdAt.slice(0, 10)} 〜 {last.createdAt.slice(0, 10)}
            </p>
          ) : null}
          <p>
            年間で多かった気分:{" "}
            <span className="font-semibold text-stone-900">
              {topMood.emoji} {topMood.label}
            </span>
          </p>
        </div>
        <p className="text-xs leading-relaxed text-stone-600">{phraseForYear(inYear.length, distinctDays, year)}</p>
      </div>
    </BookPageFrame>
  );
}

export function DiaryBoundGoalsPage({ year }: { year: number }) {
  return (
    <BookPageFrame eyebrow="製本イメージ" title={`目標・大切にしたいこと（${year}年）`}>
      <div
        className="mx-auto flex w-full max-w-[540px] flex-col gap-4 overflow-hidden rounded-lg border border-dashed border-amber-300/80 bg-amber-50/40 p-6 shadow-inner"
        style={PAGE_ASPECT}
      >
        <p className="text-xs leading-relaxed text-stone-700">
          実際の製本では、このあたりに「この年の目標」や「大切にしたいこと」を手書き・デザインで置く想定です。いまはアプリ内の記録だけを材料にしているため、ここは余白として確保しています。
        </p>
        <div className="min-h-[42%] flex-1 rounded-md border border-dashed border-stone-300 bg-white/60" aria-label="目標を書く余白" />
        <p className="text-[11px] text-stone-500">
          デジタル版では未入力です。思いついたら日記の本文や別のメモに残しても大丈夫です。
        </p>
      </div>
    </BookPageFrame>
  );
}

export type BoundPageKind =
  | { kind: "cover" }
  | { kind: "inside-cover" }
  | { kind: "month"; monthIndex: number; calendarYear?: number }
  | { kind: "reflection" }
  | { kind: "goals" }
  | { kind: "entry"; entry: BoundDiaryEntry; entryIndex: number }
  | { kind: "back" };

export function buildBoundYearPages(
  entries: BoundDiaryEntry[],
  options?: { monthStartIndex: number; monthEndIndex: number },
): BoundPageKind[] {
  const monthStart = Math.max(0, Math.min(11, options?.monthStartIndex ?? 0));
  const monthEnd = Math.max(0, Math.min(11, options?.monthEndIndex ?? 11));
  const lo = Math.min(monthStart, monthEnd);
  const hi = Math.max(monthStart, monthEnd);
  const monthPages: BoundPageKind[] = [];
  for (let monthIndex = lo; monthIndex <= hi; monthIndex += 1) {
    monthPages.push({ kind: "month", monthIndex });
  }
  const front: BoundPageKind[] = [{ kind: "cover" }, ...monthPages, { kind: "reflection" }, { kind: "goals" }];
  const body: BoundPageKind[] = entries.map((entry, entryIndex) => ({
    kind: "entry" as const,
    entry,
    entryIndex,
  }));
  return [...front, ...body, { kind: "back" as const }];
}

export function boundPageLabel(page: BoundPageKind, year: number, entryTotal: number): string {
  switch (page.kind) {
    case "cover":
      return "表紙";
    case "inside-cover":
      return "中表紙";
    case "month": {
      const y = page.calendarYear ?? year;
      return `${y}年${page.monthIndex + 1}月`;
    }
    case "reflection":
      return "振り返り";
    case "goals":
      return "目標・余白";
    case "entry":
      return `記録 ${page.entryIndex + 1} / ${entryTotal}`;
    case "back":
      return "裏表紙";
  }
}
