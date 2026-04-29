"use client";

import Image from "next/image";

import { diaryTemplateScreenImageMap } from "@/lib/journal/templateAssets";
import { phraseForMonth, phraseForYear } from "@/lib/journal/diaryPhrases";
import { getCompanionStamp, getMoodMeta, isDiaryDesignId, type DiaryDesignId } from "@/lib/journal/meta";

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
  diaryNumbers?: {
    today: number;
    month: number;
    year: number;
    calmness: number;
  };
};

const PAGE_ASPECT = { aspectRatio: "724 / 1024" as const };

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
  coverTheme?: DiaryDesignId | string;
  displayTitle?: string | null;
}) {
  const rawTheme = String(coverTheme ?? "");
  const theme: DiaryDesignId = isDiaryDesignId(rawTheme) ? rawTheme : "simple";
  const headline = displayTitle?.trim() ? displayTitle.trim() : `${year}年`;
  return (
    <BookPageFrame eyebrow="製本イメージ" title={`表紙 · ${year}年`}>
      <div
        className="relative mx-auto w-full max-w-[540px] overflow-hidden rounded-lg border border-emerald-200 bg-gradient-to-b from-emerald-50 via-[#fdfaf4] to-stone-100 shadow-inner"
        style={PAGE_ASPECT}
      >
        <Image
          src={diaryTemplateScreenImageMap[theme]}
          alt=""
          fill
          className="object-contain opacity-35"
          sizes="540px"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <p className="text-2xl font-bold tracking-tight text-emerald-900/90 sm:text-4xl">{headline}</p>
          <p className="text-base font-semibold text-stone-800">Life Journey Diary</p>
          <p className="mt-2 max-w-[18em] text-xs leading-relaxed text-stone-600">
            この本は、あなたが残した日々の記録をまとめた製本イメージです。表紙からめくると、年間の足跡と本文が続きます。
          </p>
          <p className="mt-4 text-2xl" aria-hidden>
            🦉
          </p>
        </div>
      </div>
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
}: {
  year: number;
  monthIndex: number;
  entries: BoundDiaryEntry[];
}) {
  const monthEntries = entriesInMonth(entries, year, monthIndex);
  const daysWithEntry = new Set<number>();
  const latestByDay = new Map<number, BoundDiaryEntry>();
  for (const entry of monthEntries) {
    const d = new Date(entry.createdAt);
    const day = d.getDate();
    daysWithEntry.add(day);
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
  const topMood = getMoodMeta(topMoodId);

  const startWeekday = new Date(year, monthIndex, 1).getDay();
  const monthDays = new Date(year, monthIndex + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === monthIndex;

  const cells: Array<number | null> = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: monthDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const label = `${year}年${monthIndex + 1}月`;

  return (
    <BookPageFrame eyebrow="製本イメージ · 足跡カレンダー" title={label}>
      <div
        className="mx-auto flex w-full max-w-[540px] flex-col gap-3 overflow-hidden rounded-lg border border-stone-200 bg-[#fdfaf4] p-4 shadow-inner"
        style={PAGE_ASPECT}
      >
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
          <p className="mt-1 text-stone-600">{phraseForMonth(monthEntries.length, topMood.id)}</p>
        </div>
      </div>
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
  | { kind: "month"; monthIndex: number }
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
    case "month":
      return `${year}年${page.monthIndex + 1}月`;
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
