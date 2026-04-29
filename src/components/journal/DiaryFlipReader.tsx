"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DiaryDesignPreview } from "@/components/journal/DiaryDesignPreview";
import {
  type BoundDiaryEntry,
  buildBoundYearPages,
  boundPageLabel,
  DiaryBoundBackCover,
  DiaryBoundFrontCover,
  DiaryBoundGoalsPage,
  DiaryBoundMonthCalendarPage,
  DiaryBoundReflectionPage,
} from "@/components/journal/DiaryYearBoundPages";
import {
  DiaryBookshelfSettingsForm,
  type DiaryBookshelfBookClientSettings,
} from "@/components/journal/DiaryBookshelfSettingsForm";
import { BookshelfDiaryBindingOrder } from "@/components/orders/BookshelfDiaryBindingOrder";
import { formatDateTimeJa } from "@/lib/date/formatJa";
import { journalEntryInBookshelfPeriod } from "@/lib/journal/bookshelfPeriod";
import { getActivityMeta, isDiaryDesignId, type DiaryDesignId } from "@/lib/journal/meta";

type Props = {
  year: number;
  initialSettings: DiaryBookshelfBookClientSettings;
};

export function DiaryFlipReader({ year, initialSettings }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pParam = searchParams.get("p");

  const [entries, setEntries] = useState<BoundDiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [panelVisible, setPanelVisible] = useState(true);
  const [updatingEntryId, setUpdatingEntryId] = useState<string | null>(null);
  const [openedMonths, setOpenedMonths] = useState<Record<string, boolean>>({});
  const [showOffEntriesByMonth, setShowOffEntriesByMonth] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [bookSettings, setBookSettings] = useState<DiaryBookshelfBookClientSettings>(initialSettings);

  useEffect(() => {
    setBookSettings(initialSettings);
  }, [initialSettings]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetch(`/api/journal?year=${year}&_=${Date.now()}`, {
      cache: "no-store",
      credentials: "same-origin",
    })
      .then(async (res) => {
        const data = (await res.json()) as { entries?: BoundDiaryEntry[]; error?: string };
        if (!res.ok) throw new Error(data.error ?? "記録の取得に失敗しました。");
        const list = [...(data.entries ?? [])].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        if (!cancelled) {
          setEntries(list);
          setPanelVisible(true);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "記録の取得に失敗しました。");
          setEntries([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [year]);

  const periodFilteredEntries = useMemo(
    () =>
      entries.filter((entry) =>
        journalEntryInBookshelfPeriod(
          entry.createdAt,
          year,
          bookSettings.periodStartMonth,
          bookSettings.periodEndMonth,
        ),
      ),
    [entries, year, bookSettings.periodStartMonth, bookSettings.periodEndMonth],
  );

  const includedEntries = useMemo(
    () => periodFilteredEntries.filter((entry) => entry.includeInBook !== false),
    [periodFilteredEntries],
  );

  const monthRange = useMemo(() => {
    const lo = Math.min(bookSettings.periodStartMonth, bookSettings.periodEndMonth) - 1;
    const hi = Math.max(bookSettings.periodStartMonth, bookSettings.periodEndMonth) - 1;
    return { monthStartIndex: lo, monthEndIndex: hi };
  }, [bookSettings.periodStartMonth, bookSettings.periodEndMonth]);

  const pages = useMemo(
    () => buildBoundYearPages(includedEntries, monthRange),
    [includedEntries, monthRange],
  );
  const totalPages = pages.length;
  const entryTotal = includedEntries.length;

  const syncPageQuery = useCallback(
    (nextIndex: number) => {
      const qs = new URLSearchParams(searchParams.toString());
      qs.set("p", String(nextIndex + 1));
      const nextUrl = `${pathname}?${qs.toString()}`;
      const currentUrl = `${pathname}?${searchParams.toString()}`;
      if (nextUrl === currentUrl) return;
      router.replace(nextUrl, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (totalPages < 1) return;
    let targetIdx = 0;
    if (pParam != null && /^\d+$/.test(pParam)) {
      const p1 = parseInt(pParam, 10);
      if (p1 >= 1) {
        targetIdx = Math.min(totalPages - 1, p1 - 1);
      }
    }
    setPageIndex((prev) => (prev === targetIdx ? prev : targetIdx));
  }, [pParam, totalPages]);

  const editReturnToParam = useMemo(() => {
    const qs = new URLSearchParams(searchParams.toString());
    qs.set("p", String(pageIndex + 1));
    return encodeURIComponent(`${pathname}?${qs.toString()}`);
  }, [pathname, searchParams, pageIndex]);
  const latestEntryPageIndex = useMemo(() => {
    for (let i = pages.length - 1; i >= 0; i -= 1) {
      if (pages[i]?.kind === "entry") return i;
    }
    return Math.max(0, pages.length - 1);
  }, [pages]);

  const canBackFromCover = useMemo(() => pages.some((p) => p.kind === "entry"), [pages]);
  const includedPageCount = useMemo(
    () => periodFilteredEntries.filter((entry) => entry.includeInBook !== false).length,
    [periodFilteredEntries],
  );

  useEffect(() => {
    if (pageIndex >= totalPages) {
      const clamped = Math.max(0, totalPages - 1);
      setPageIndex(clamped);
      syncPageQuery(clamped);
    }
  }, [pageIndex, totalPages, syncPageQuery]);

  const current = pages[pageIndex];

  const monthlyBuckets = useMemo(() => {
    const map = new Map<
      string,
      { key: string; year: number; month: number; label: string; entries: BoundDiaryEntry[] }
    >();
    for (const entry of periodFilteredEntries) {
      const date = new Date(entry.createdAt);
      const y = date.getFullYear();
      const m = date.getMonth() + 1;
      const key = `${y}-${String(m).padStart(2, "0")}`;
      if (!map.has(key)) {
        map.set(key, { key, year: y, month: m, label: `${y}年${m}月`, entries: [] });
      }
      map.get(key)!.entries.push(entry);
    }
    return [...map.values()]
      .map((bucket) => ({
        ...bucket,
        entries: [...bucket.entries].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        ),
      }))
      .sort((a, b) => (a.key < b.key ? 1 : -1));
  }, [periodFilteredEntries]);

  const entryTheme: DiaryDesignId = useMemo(() => {
    if (current?.kind !== "entry") return "simple";
    const t = current.entry.designTheme;
    if (!t) return "simple";
    return isDiaryDesignId(t) ? t : "simple";
  }, [current]);

  const tryGoDelta = useCallback(
    (delta: number) => {
      let next = pageIndex + delta;
      // 表紙で「左へ」のときは、最新記事から逆順に確認できる導線にする。
      if (pageIndex === 0 && delta < 0) {
        const hasEntryPage = pages.some((p) => p.kind === "entry");
        if (!hasEntryPage) return;
        next = latestEntryPageIndex;
      }
      if (next < 0 || next >= totalPages) return;
      setPanelVisible(false);
      window.setTimeout(() => {
        setPageIndex(next);
        syncPageQuery(next);
        setPanelVisible(true);
      }, 220);
    },
    [latestEntryPageIndex, pageIndex, pages, syncPageQuery, totalPages],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        tryGoDelta(1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        tryGoDelta(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tryGoDelta]);

  const onTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    if (!t) return;
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!start) return;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      if (Math.abs(dx) < 44) return;
      if (Math.abs(dx) < Math.abs(dy) * 1.15) return;
      if (dx < 0) {
        tryGoDelta(1);
      } else {
        tryGoDelta(-1);
      }
    },
    [tryGoDelta],
  );

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 1800);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const setEntryInclude = useCallback(
    async (id: string, nextIncludeInBook: boolean) => {
      const previous = entries;
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === id ? { ...entry, includeInBook: nextIncludeInBook } : entry,
        ),
      );
      setUpdatingEntryId(id);
      try {
        const target = previous.find((entry) => entry.id === id);
        if (!target) return;
        const res = await fetch(`/api/journal/${encodeURIComponent(id)}`, {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: target.content,
            mood: target.mood,
            activity: target.activity,
            companionType: target.companionType,
            designTheme: target.designTheme ?? "simple",
            photoDataUrl: target.photoDataUrl ?? "",
            entryDate: new Date(target.createdAt).toISOString().slice(0, 10),
            includeInBook: nextIncludeInBook,
          }),
        });
        if (!res.ok) throw new Error("failed");
        showToast("保存しました");
      } catch {
        setEntries(previous);
        setError("製本設定の更新に失敗しました。時間をおいて再度お試しください。");
      } finally {
        setUpdatingEntryId((prev) => (prev === id ? null : prev));
      }
    },
    [entries, showToast],
  );

  const setMonthInclude = useCallback(
    async (ids: string[], nextIncludeInBook: boolean) => {
      if (ids.length === 0) return;
      const previous = entries;
      const idSet = new Set(ids);
      setEntries((prev) =>
        prev.map((entry) =>
          idSet.has(entry.id) ? { ...entry, includeInBook: nextIncludeInBook } : entry,
        ),
      );
      setUpdatingEntryId(`bulk:${ids[0]}`);
      try {
        const res = await fetch("/api/journal/include", {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids, includeInBook: nextIncludeInBook }),
        });
        if (!res.ok) throw new Error("failed");
        showToast("保存しました");
      } catch {
        setEntries(previous);
        setError("月単位の更新に失敗しました。時間をおいて再度お試しください。");
      } finally {
        setUpdatingEntryId(null);
      }
    },
    [entries, showToast],
  );

  if (loading) {
    return <p className="text-sm text-stone-500">{year}年の記録を読み込み中…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-700">{error}</p>;
  }

  if (!current) {
    return null;
  }

  const pageTitle = boundPageLabel(current, year, entryTotal);

  return (
    <div className="space-y-4">
      <DiaryBookshelfSettingsForm
        year={year}
        initialSettings={bookSettings}
        onSaved={(next) => {
          setBookSettings(next);
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
        <p className="text-sm text-stone-700">
          <span className="font-semibold text-stone-900">
            {pageIndex + 1} / {totalPages}
          </span>
          <span className="ml-2 text-stone-600">{pageTitle}</span>
          {current.kind === "entry" ? (
            <span className="ml-2 text-stone-500">{formatDateTimeJa(current.entry.createdAt)}</span>
          ) : null}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={pageIndex === 0 ? !canBackFromCover : false}
            onClick={() => tryGoDelta(-1)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-800 hover:bg-stone-50 disabled:opacity-40"
          >
            ← 前へ
          </button>
          <button
            type="button"
            disabled={pageIndex >= totalPages - 1}
            onClick={() => tryGoDelta(1)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-800 hover:bg-stone-50 disabled:opacity-40"
          >
            次へ →
          </button>
          {entryTotal === 0 ? (
            <Link href="/journal" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-900 hover:bg-emerald-100">
              記録する
            </Link>
          ) : null}
        </div>
      </div>

      <div
        className="relative rounded-xl border border-stone-200 bg-[#faf8f4] p-2 shadow-inner sm:p-3"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <button
          type="button"
          aria-label="前のページ"
          disabled={pageIndex === 0 ? !canBackFromCover : false}
          onClick={() => tryGoDelta(-1)}
          className="absolute left-1 top-1/2 z-20 -translate-y-1/2 rounded-full border border-stone-300 bg-white/90 px-2.5 py-2 text-sm text-stone-700 shadow hover:bg-white disabled:cursor-not-allowed disabled:opacity-30 sm:left-2"
        >
          ←
        </button>
        <button
          type="button"
          aria-label="次のページ"
          disabled={pageIndex >= totalPages - 1}
          onClick={() => tryGoDelta(1)}
          className="absolute right-1 top-1/2 z-20 -translate-y-1/2 rounded-full border border-stone-300 bg-white/90 px-2.5 py-2 text-sm text-stone-700 shadow hover:bg-white disabled:cursor-not-allowed disabled:opacity-30 sm:right-2"
        >
          →
        </button>
        <div
          className={[
            "transition duration-300 ease-out",
            panelVisible ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0 sm:-translate-x-6",
          ].join(" ")}
        >
          {current.kind === "cover" ? (
            <DiaryBoundFrontCover
              year={year}
              coverTheme={bookSettings.coverTheme}
              displayTitle={bookSettings.displayTitle}
            />
          ) : null}
          {current.kind === "month" ? (
            <DiaryBoundMonthCalendarPage year={year} monthIndex={current.monthIndex} entries={includedEntries} />
          ) : null}
          {current.kind === "reflection" ? <DiaryBoundReflectionPage year={year} entries={includedEntries} /> : null}
          {current.kind === "goals" ? <DiaryBoundGoalsPage year={year} /> : null}
          {current.kind === "entry" ? (
            <div>
              <DiaryDesignPreview
                designTheme={entryTheme}
                mood={current.entry.mood}
                activity={current.entry.activity}
                content={current.entry.content}
                comment={current.entry.generatedComment}
                photoDataUrl={current.entry.photoDataUrl}
                previewDate={new Date(current.entry.createdAt)}
                diaryNumbers={current.entry.diaryNumbers}
              />
              <p className="mt-2 text-center">
                <Link
                  href={`/journal?edit=${encodeURIComponent(current.entry.id)}&returnTo=${editReturnToParam}`}
                  className="text-[11px] font-medium text-emerald-800 underline-offset-2 hover:underline"
                >
                  この記事を編集する
                </Link>
              </p>
            </div>
          ) : null}
          {current.kind === "back" ? <DiaryBoundBackCover year={year} /> : null}
        </div>
      </div>

      <p className="text-center text-xs text-stone-500">
        表紙・選択した月のカレンダー・振り返り・目標ページのあと、日付の古い順に本文が続きます（製本期間内かつ本に入れるONの記事のみ）。PCは左右矢印・キーボード、スマホはスワイプでもめくれます。
      </p>

      <section className="space-y-3 rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
        <h3 className="text-base font-semibold text-stone-900">製本前確認</h3>
        <p className="text-xs text-stone-600">
          「このページを本に入れる」のON/OFFを見直せます。月ごとの一括操作もできます。
        </p>

        <BookshelfDiaryBindingOrder year={year} pageCount={includedPageCount} />

        {monthlyBuckets.length === 0 ? (
          <p className="text-sm text-stone-500">この年の記録がありません。</p>
        ) : (
          <div className="space-y-2">
            {monthlyBuckets.map((bucket) => {
              const includedCount = bucket.entries.filter((entry) => entry.includeInBook !== false).length;
              const excludedCount = bucket.entries.length - includedCount;
              const isOpen = openedMonths[bucket.key] ?? false;
              const showOffEntries = showOffEntriesByMonth[bucket.key] ?? false;
              const visibleEntries = showOffEntries
                ? bucket.entries
                : bucket.entries.filter((entry) => entry.includeInBook !== false);
              return (
                <div key={bucket.key} className="rounded-lg border border-stone-200 bg-stone-50/70">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                    <p className="text-sm font-medium text-stone-900">
                      {bucket.label} {includedCount}ページ
                    </p>
                    <button
                      type="button"
                      className="rounded-md border border-stone-300 bg-white px-2 py-1 text-xs text-stone-700 hover:bg-stone-50"
                      onClick={() =>
                        setOpenedMonths((prev) => ({ ...prev, [bucket.key]: !(prev[bucket.key] ?? false) }))
                      }
                    >
                      {isOpen ? "閉じる" : "開く"}
                    </button>
                  </div>
                  {isOpen ? (
                    <div className="space-y-2 border-t border-stone-200 px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs text-emerald-900 hover:bg-emerald-100"
                          onClick={() => void setMonthInclude(bucket.entries.map((entry) => entry.id), true)}
                          disabled={updatingEntryId !== null}
                        >
                          この月をすべて本に入れる
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-stone-300 bg-white px-2 py-1 text-xs text-stone-700 hover:bg-stone-100"
                          onClick={() => void setMonthInclude(bucket.entries.map((entry) => entry.id), false)}
                          disabled={updatingEntryId !== null}
                        >
                          この月をすべて外す
                        </button>
                        {excludedCount > 0 ? (
                          <button
                            type="button"
                            className="rounded-md border border-stone-300 bg-white px-2 py-1 text-xs text-stone-700 hover:bg-stone-100"
                            onClick={() =>
                              setShowOffEntriesByMonth((prev) => ({
                                ...prev,
                                [bucket.key]: !(prev[bucket.key] ?? false),
                              }))
                            }
                          >
                            {showOffEntries
                              ? "本に入れない記事を隠す"
                              : `本に入れない記事を表示（${excludedCount}件）`}
                          </button>
                        ) : null}
                      </div>
                      {!showOffEntries && excludedCount > 0 ? (
                        <p className="text-[11px] text-stone-500">
                          本に入れない記事 {excludedCount}件 は非表示です。
                        </p>
                      ) : null}
                      <ul className="space-y-1.5">
                        {visibleEntries.map((entry) => {
                          const d = new Date(entry.createdAt);
                          const dateLabel = `${d.getMonth() + 1}/${d.getDate()}`;
                          return (
                            <li key={entry.id} className="rounded-md border border-stone-200 bg-white px-2 py-2 text-xs">
                              <label className="flex items-start justify-between gap-3">
                                <span className="min-w-0 text-stone-700">
                                  {dateLabel}　{getActivityMeta(entry.activity).label}
                                </span>
                                <span className="shrink-0">
                                  <input
                                    type="checkbox"
                                    checked={entry.includeInBook !== false}
                                    disabled={updatingEntryId !== null}
                                    onChange={(e) => void setEntryInclude(entry.id, e.target.checked)}
                                    className="h-4 w-4 rounded border-stone-300 text-emerald-700 focus:ring-emerald-600"
                                  />
                                  <span className="ml-1.5 text-stone-600">
                                    {entry.includeInBook !== false ? "ON" : "OFF"}
                                  </span>
                                </span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {toastMessage ? (
        <div className="fixed bottom-5 right-5 z-50 rounded-lg bg-stone-900 px-3 py-2 text-xs font-medium text-white shadow-lg">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}
