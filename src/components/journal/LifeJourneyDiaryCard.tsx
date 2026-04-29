"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { phraseForMonth } from "@/lib/journal/diaryPhrases";
import { getCompanionStamp, getMoodMeta } from "@/lib/journal/meta";

type Entry = {
  id: string;
  content: string;
  mood: string;
  companionType: string;
  createdAt: string;
};

function toMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthLabel(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function dayGridAnchor(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toDateParam(year: number, monthZeroBased: number, day: number): string {
  const y = String(year);
  const m = String(monthZeroBased + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function fetchJournalMonth(monthKey: string): Promise<Entry[]> {
  const res = await fetch(`/api/journal?month=${encodeURIComponent(monthKey)}&_=${Date.now()}`, {
    cache: "no-store",
    credentials: "same-origin",
  });
  const data = (await res.json()) as { entries?: Entry[]; error?: string };
  if (!res.ok) throw new Error(data.error ?? "記録の取得に失敗しました。");
  return data.entries ?? [];
}

export function LifeJourneyDiaryCard() {
  const [cursorMonth, setCursorMonth] = useState(() => dayGridAnchor(new Date()));
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthKey = useMemo(() => toMonthKey(cursorMonth), [cursorMonth]);
  const monthKeyRef = useRef(monthKey);
  monthKeyRef.current = monthKey;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const list = await fetchJournalMonth(monthKey);
        if (!cancelled) setEntries(list);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "記録の取得に失敗しました。");
          setEntries([]);
        }
      } finally {
        // Strict Mode では cleanup が先に走ることがあるため、
        // cancelled 時でも loading を必ず false に戻す。
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [monthKey]);

  useEffect(() => {
    const reload = () => {
      void (async () => {
        try {
          const list = await fetchJournalMonth(monthKeyRef.current);
          setEntries(list);
          setError(null);
        } catch (e) {
          setError(e instanceof Error ? e.message : "記録の取得に失敗しました。");
          setEntries([]);
        }
      })();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") reload();
    };
    window.addEventListener("focus", reload);
    window.addEventListener("pageshow", reload);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", reload);
      window.removeEventListener("pageshow", reload);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const daysWithEntry = useMemo(() => {
    const set = new Set<number>();
    for (const entry of entries) {
      const d = new Date(entry.createdAt);
      if (
        d.getFullYear() === cursorMonth.getFullYear() &&
        d.getMonth() === cursorMonth.getMonth()
      ) {
        set.add(d.getDate());
      }
    }
    return set;
  }, [entries, cursorMonth]);

  const latestEntryByDay = useMemo(() => {
    const map = new Map<number, Entry>();
    for (const entry of entries) {
      const d = new Date(entry.createdAt);
      if (
        d.getFullYear() === cursorMonth.getFullYear() &&
        d.getMonth() === cursorMonth.getMonth()
      ) {
        const day = d.getDate();
        if (!map.has(day)) map.set(day, entry);
      }
    }
    return map;
  }, [entries, cursorMonth]);

  const moodCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of entries) {
      map.set(entry.mood, (map.get(entry.mood) ?? 0) + 1);
    }
    return map;
  }, [entries]);

  const topMood = useMemo(() => {
    let best = "calm";
    let bestCount = -1;
    for (const [k, v] of moodCount.entries()) {
      if (v > bestCount) {
        best = k;
        bestCount = v;
      }
    }
    return getMoodMeta(best);
  }, [moodCount]);

  const startWeekday = new Date(cursorMonth.getFullYear(), cursorMonth.getMonth(), 1).getDay();
  const monthDays = new Date(cursorMonth.getFullYear(), cursorMonth.getMonth() + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === cursorMonth.getFullYear() && today.getMonth() === cursorMonth.getMonth();

  const cells: Array<number | null> = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: monthDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <section className="space-y-4 rounded-2xl border border-emerald-200 bg-[#fdfaf4] p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-stone-900">Life Journey Diary</h2>
        <Link href="/journal" className="text-sm text-emerald-900 hover:underline">
          記録する
        </Link>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-3 py-2">
        <button
          type="button"
          onClick={() =>
            setCursorMonth(
              (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
            )
          }
          className="rounded px-2 py-1 text-sm text-stone-600 hover:bg-stone-100 hover:text-stone-900"
          aria-label="前の月"
        >
          ←
        </button>
        <p className="text-sm font-semibold text-stone-800">{monthLabel(cursorMonth)}</p>
        <button
          type="button"
          onClick={() =>
            setCursorMonth(
              (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
            )
          }
          className="rounded px-2 py-1 text-sm text-stone-600 hover:bg-stone-100 hover:text-stone-900"
          aria-label="次の月"
        >
          →
        </button>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-3">
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-stone-500">
          {["日", "月", "火", "水", "木", "金", "土"].map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
          {cells.map((day, idx) => {
            const isToday =
              day !== null &&
              isCurrentMonth &&
              day === today.getDate();
            const hasEntry = day !== null && daysWithEntry.has(day);
            const stampEntry = day !== null ? latestEntryByDay.get(day) ?? null : null;
            return (
              <div
                key={`${idx}-${day ?? "blank"}`}
                className={[
                  "min-h-10 rounded-md border text-xs",
                  day === null ? "border-transparent" : "border-stone-100 bg-stone-50",
                  isToday ? "ring-1 ring-amber-300" : "",
                ].join(" ")}
              >
                {day === null ? null : hasEntry && stampEntry ? (
                  <div className="flex h-full flex-col items-center justify-center leading-tight text-stone-700">
                    <span>{day}</span>
                    <Link
                      href={`/journal?edit=${encodeURIComponent(stampEntry.id)}`}
                      className="text-[11px] hover:opacity-80"
                      title="この日の記録を編集"
                    >
                      {getCompanionStamp(stampEntry.companionType)}
                    </Link>
                  </div>
                ) : (
                  <Link
                    href={`/journal?date=${encodeURIComponent(
                      toDateParam(cursorMonth.getFullYear(), cursorMonth.getMonth(), day),
                    )}`}
                    className="flex h-full flex-col items-center justify-center leading-tight text-stone-700 hover:bg-stone-100"
                    title="この日付で新しい記録を作成"
                  >
                    <span>{day}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-stone-500">
          🐾: 記録した日 / 今日: 淡い金色の枠
        </p>
      </div>

      <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-sm text-stone-700">
        {loading ? (
          <p>今月の記録を読み込み中…</p>
        ) : error ? (
          <p>今月の記録を取得できませんでした。</p>
        ) : (
          <div className="space-y-1.5">
            <p>
              今月の記録: <span className="font-semibold text-stone-900">{entries.length}日</span>
            </p>
            <p>
              今月よく出た気分:{" "}
              <span className="font-semibold text-stone-900">
                {topMood.emoji} {topMood.label}
              </span>
            </p>
            <p>今月のひとこと: {phraseForMonth(entries.length, topMood.id)}</p>
          </div>
        )}
      </div>
    </section>
  );
}
