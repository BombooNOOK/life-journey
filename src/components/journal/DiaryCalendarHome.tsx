"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DiaryHomeBottomNav } from "@/components/journal/DiaryHomeBottomNav";
import { DiarySyncDebugPanel } from "@/components/journal/DiarySyncDebugPanel";
import {
  DiaryMonthCalendar,
  type DiaryMonthCalendarEntry,
} from "@/components/journal/DiaryMonthCalendar";
import { ProfileSwitcher } from "@/components/profile/ProfileSwitcher";
import { useEnsureServerAuthSession } from "@/hooks/useEnsureServerAuthSession";
import {
  formatDateTimeJa,
  formatJournalListCreatedLabel,
  shouldShowJournalUpdatedLabel,
} from "@/lib/date/formatJa";
import { journalEntryLayoutLengthFlag } from "@/lib/journal/contentFontMode";
import {
  calendarDayKeyFromParts,
  calendarDayKeyInJapan,
  entryDayKeyInJapan,
  journalEditPath,
  journalNewEntryPath,
  journalPreviewPath,
  monthAnchorFromMonthKey,
  parseMonthKeyParam,
} from "@/lib/journal/journalNav";
import { getActivityMeta, getMoodMeta } from "@/lib/journal/meta";

export type DiaryCalendarEntry = DiaryMonthCalendarEntry & {
  content: string;
  mood: string;
  activity: string;
  designTheme?: string;
  contentFontMode?: string;
  hasPhoto?: boolean;
  includeInBook?: boolean;
  updatedAt?: string;
};

type ProfileOption = { id: string; nickname: string };

type Props = {
  profiles: ProfileOption[];
  activeProfileId: string;
  activeProfileNickname: string;
};

function toMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function dayGridAnchor(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function parseDayParam(value: string | null): { year: number; monthIndex: number; day: number } | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const year = Number(m[1]);
  const monthIndex = Number(m[2]) - 1;
  const day = Number(m[3]);
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || !Number.isFinite(day)) return null;
  return { year, monthIndex, day };
}

async function fetchJournalMonth(monthKey: string, profileId: string): Promise<DiaryCalendarEntry[]> {
  const qs = new URLSearchParams({
    month: monthKey,
    profileId,
    view: "calendar",
    _: String(Date.now()),
  });
  const res = await fetch(`/api/journal?${qs.toString()}`, {
    cache: "no-store",
    credentials: "same-origin",
  });
  const data = (await res.json()) as { entries?: DiaryCalendarEntry[]; error?: string };
  if (!res.ok) throw new Error(data.error ?? "記録の取得に失敗しました。");
  return data.entries ?? [];
}

function formatSelectedDayLabel(year: number, monthIndex: number, day: number): string {
  return `${year}年${monthIndex + 1}月${day}日`;
}

export function DiaryCalendarHome({
  profiles,
  activeProfileId,
  activeProfileNickname,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listRef = useRef<HTMLDivElement>(null);
  const authSession = useEnsureServerAuthSession();
  const showSyncDebug = searchParams.get("syncDebug") === "1";
  const debugDay = searchParams.get("debugDay");
  const debugEntryId = searchParams.get("debugEntry");
  const [effectiveProfileId, setEffectiveProfileId] = useState(activeProfileId);

  const effectiveProfileNickname = useMemo(() => {
    const match = profiles.find((p) => p.id === effectiveProfileId);
    return match?.nickname ?? activeProfileNickname;
  }, [profiles, effectiveProfileId, activeProfileNickname]);

  const initialDay = parseDayParam(searchParams.get("day"));
  const initialMonthKey = parseMonthKeyParam(searchParams.get("month"));
  const [viewMonth, setViewMonth] = useState(() => {
    if (initialDay) return new Date(initialDay.year, initialDay.monthIndex, 1);
    if (initialMonthKey) return monthAnchorFromMonthKey(initialMonthKey);
    return dayGridAnchor(new Date());
  });
  const [selectedDay, setSelectedDay] = useState<number | null>(initialDay?.day ?? null);
  const [entries, setEntries] = useState<DiaryCalendarEntry[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const fetchGenerationRef = useRef(0);

  const monthKey = useMemo(() => toMonthKey(viewMonth), [viewMonth]);
  const calendarLoadingLabel = !hasLoadedOnce
    ? "カレンダーを読み込み中です…"
    : "フクロウ先生が日記の足跡を確認しています…";
  const CALENDAR_FETCH_ERROR =
    "日記の足跡を読み込めませんでした。時間をおいて再度お試しください。";
  const returnToBase = useMemo(() => {
    const qs = new URLSearchParams();
    if (selectedDay !== null) {
      qs.set("day", calendarDayKeyFromParts(viewMonth.getFullYear(), viewMonth.getMonth(), selectedDay));
    }
    const q = qs.toString();
    return q ? `/orders/calendar?${q}` : "/orders/calendar";
  }, [viewMonth, selectedDay]);

  useEffect(() => {
    setEffectiveProfileId(activeProfileId);
  }, [activeProfileId]);

  useEffect(() => {
    if (!authSession.ready) return;
    let cancelled = false;
    void fetch("/api/profiles", { cache: "no-store", credentials: "same-origin" })
      .then(async (res) => {
        const data = (await res.json()) as { activeProfileId?: string };
        if (!res.ok || cancelled) return;
        const next = String(data.activeProfileId ?? "").trim();
        if (next) setEffectiveProfileId(next);
      })
      .catch(() => {
        /* SSR の activeProfileId を継続利用 */
      });
    return () => {
      cancelled = true;
    };
  }, [authSession.ready, authSession.firebaseEmail]);

  const loadMonthFor = useCallback(
    async (targetMonth: Date, opts?: { clearSelection?: boolean }) => {
      const generation = ++fetchGenerationRef.current;
      const key = toMonthKey(targetMonth);
      setIsFetching(true);
      setError(null);
      try {
        const list = await fetchJournalMonth(key, effectiveProfileId);
        if (generation !== fetchGenerationRef.current) return;
        setViewMonth(targetMonth);
        setEntries(list);
        setHasLoadedOnce(true);
        if (opts?.clearSelection) setSelectedDay(null);
      } catch {
        if (generation !== fetchGenerationRef.current) return;
        setError(CALENDAR_FETCH_ERROR);
      } finally {
        if (generation === fetchGenerationRef.current) {
          setIsFetching(false);
        }
      }
    },
    [effectiveProfileId],
  );

  useEffect(() => {
    if (!authSession.ready) return;
    void loadMonthFor(viewMonth, { clearSelection: false });
  }, [authSession.ready, effectiveProfileId, loadMonthFor, viewMonth]);

  useEffect(() => {
    const reload = () => {
      if (!authSession.ready) return;
      void loadMonthFor(viewMonth, { clearSelection: false });
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
  }, [authSession.ready, loadMonthFor, viewMonth]);

  const shiftMonth = useCallback(
    (delta: -1 | 1) => {
      if (isFetching) return;
      const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1);
      setSelectedDay(null);
      setViewMonth(next);
    },
    [isFetching, viewMonth],
  );

  const selectedDayEntries = useMemo(() => {
    if (selectedDay === null) return [];
    const y = viewMonth.getFullYear();
    const m = viewMonth.getMonth();
    const key = calendarDayKeyFromParts(y, m, selectedDay);
    return entries
      .filter((e) => entryDayKeyInJapan(e.createdAt) === key)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [entries, selectedDay, viewMonth]);

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    const qs = new URLSearchParams();
    const dayKey = calendarDayKeyFromParts(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    qs.set("day", dayKey);
    if (showSyncDebug) {
      qs.set("syncDebug", "1");
      qs.set("debugDay", dayKey);
      if (debugEntryId) qs.set("debugEntry", debugEntryId);
    }
    router.replace(`/orders/calendar?${qs.toString()}`, { scroll: false });
    requestAnimationFrame(() => {
      listRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  };

  const selectedDayKey =
    selectedDay !== null
      ? calendarDayKeyFromParts(viewMonth.getFullYear(), viewMonth.getMonth(), selectedDay)
      : null;

  const todayDayKey = useMemo(() => calendarDayKeyInJapan(new Date()), []);

  const journalTodayHref = useMemo(
    () => journalNewEntryPath(todayDayKey, returnToBase, effectiveProfileId),
    [todayDayKey, returnToBase, effectiveProfileId],
  );

  const journalSelectedHref =
    selectedDayKey !== null
      ? journalNewEntryPath(selectedDayKey, returnToBase, effectiveProfileId)
      : null;

  const showSelectedDayWriteButton =
    selectedDayKey !== null && selectedDayKey !== todayDayKey;

  const profileNameButtonClass =
    "min-w-0 truncate font-medium text-emerald-900 underline decoration-emerald-300/80 underline-offset-2 hover:text-emerald-950";
  const writeButtonBase =
    "flex min-h-[44px] w-[92%] max-w-[360px] items-center justify-center rounded-xl px-4 py-2.5 text-center text-sm font-semibold shadow-sm transition sm:min-h-[46px] sm:w-auto sm:min-w-[12rem] sm:max-w-[17rem]";
  const writeTodayButtonClass = `${writeButtonBase} border border-[#E7C66A] bg-[#D8A93A] text-white hover:bg-[#C99A2E]`;
  const writeSelectedDayButtonClass = `${writeButtonBase} border border-emerald-300/80 bg-emerald-700 text-white hover:border-emerald-400 hover:bg-emerald-800`;

  return (
    <div className="pb-24">
      <div className="space-y-1.5 sm:space-y-4">
        <div className="max-sm:pt-0 sm:space-y-2">
          <Link
            href="/orders"
            className="hidden text-sm text-stone-600 hover:text-stone-900 sm:inline"
          >
            ← マイページ（従来）
          </Link>
          <h1 className="mt-0 hidden text-xl font-bold leading-snug text-stone-900 sm:mt-2 sm:block sm:text-2xl">
            <button
              type="button"
              onClick={() => setShowProfilePanel((v) => !v)}
              className="text-emerald-900 underline decoration-emerald-300/80 underline-offset-4 hover:text-emerald-950"
              aria-expanded={showProfilePanel}
              aria-controls="diary-profile-switcher"
            >
              【{effectiveProfileNickname}】
            </button>
            Life Journey Diary
          </h1>
          <p
            className="flex min-w-0 items-baseline gap-0.5 text-xs leading-snug sm:hidden"
            title={`現在のプロフィール：${effectiveProfileNickname}`}
          >
            <span className="shrink-0 text-stone-500">現在のプロフィール：</span>
            <button
              type="button"
              onClick={() => setShowProfilePanel((v) => !v)}
              className={profileNameButtonClass}
              aria-expanded={showProfilePanel}
              aria-controls="diary-profile-switcher"
            >
              {effectiveProfileNickname}
            </button>
          </p>
        </div>

        {showProfilePanel ? (
          <div id="diary-profile-switcher">
            <ProfileSwitcher profiles={profiles} activeProfileId={effectiveProfileId} />
          </div>
        ) : null}

        {authSession.mismatch ? (
          <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            ログイン情報の同期にずれがあります。一度ログアウトしてから再ログインしてください。
          </p>
        ) : null}

        {showSyncDebug ? (
          <DiarySyncDebugPanel
            monthKey={monthKey}
            profileId={effectiveProfileId}
            authSession={authSession}
            debugDay={debugDay}
            debugEntryId={debugEntryId}
          />
        ) : null}

        <div className="space-y-2">
          <DiaryMonthCalendar
            cursorMonth={viewMonth}
            entries={entries}
            selectedDay={selectedDay}
            isFetching={isFetching}
            loadingLabel={calendarLoadingLabel}
            onSelectDay={handleSelectDay}
            onPrevMonth={() => shiftMonth(-1)}
            onNextMonth={() => shiftMonth(1)}
          />
          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          ) : null}
        </div>

        <div className="py-1 sm:py-2">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
            <Link href={journalTodayHref} className={writeTodayButtonClass}>
              今日の記録を書く
            </Link>
            {showSelectedDayWriteButton && journalSelectedHref ? (
              <Link href={journalSelectedHref} className={writeSelectedDayButtonClass}>
                選択した日の記録を書く
              </Link>
            ) : null}
          </div>
        </div>

        <div ref={listRef} className="scroll-mt-4 space-y-3">
          {selectedDay === null ? (
            <p className="rounded-xl border border-dashed border-stone-200 bg-stone-50/80 px-4 py-6 text-center text-sm text-stone-500">
              日付をタップすると、その日の記録がここに表示されます。
            </p>
          ) : (
            <>
              <h2 className="text-base font-semibold text-stone-900">
                {formatSelectedDayLabel(
                  viewMonth.getFullYear(),
                  viewMonth.getMonth(),
                  selectedDay,
                )}
                の記録
                <span className="ml-2 text-sm font-normal text-stone-500">
                  {selectedDayEntries.length}件
                </span>
              </h2>

              {selectedDayEntries.length === 0 ? (
                <div className="rounded-xl border border-stone-200 bg-white px-4 py-6 text-center text-sm text-stone-600">
                  <p>この日の記録はまだありません。</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {selectedDayEntries.map((entry) => {
                    const mood = getMoodMeta(entry.mood);
                    const activity = getActivityMeta(entry.activity);
                    const longFlag = journalEntryLayoutLengthFlag(
                      entry.contentFontMode,
                      entry.content,
                    );
                    const showUpdatedAt =
                      entry.updatedAt &&
                      new Date(entry.updatedAt).getTime() !== new Date(entry.createdAt).getTime();
                    return (
                      <li
                        key={entry.id}
                        className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-stone-900">
                              {formatJournalListCreatedLabel(entry.createdAt)}
                            </p>
                            {showUpdatedAt ? (
                              <p className="mt-0.5 text-[11px] text-stone-400">
                                最終更新：{formatDateTimeJa(entry.updatedAt!)}
                              </p>
                            ) : null}
                            <p className="mt-1 text-sm text-stone-700">
                              {mood.emoji} {mood.label} · {activity.label}
                            </p>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {entry.hasPhoto === true ? (
                                <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-600">
                                  写真あり
                                </span>
                              ) : null}
                              {longFlag !== "ok" ? (
                                <span className="rounded bg-amber-100/90 px-1.5 py-0.5 text-[10px] font-medium text-amber-950">
                                  長文注意
                                </span>
                              ) : null}
                              {entry.includeInBook === false ? (
                                <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-500">
                                  製本OFF
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Link
                            href={journalPreviewPath(entry.id, entry.designTheme, returnToBase)}
                            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-100/80 sm:flex-none sm:px-4"
                          >
                            プレビュー
                          </Link>
                          <Link
                            href={journalEditPath(entry.id, returnToBase, effectiveProfileId)}
                            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 sm:flex-none sm:px-4"
                          >
                            編集
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>
      </div>

      <DiaryHomeBottomNav journalWriteHref={journalTodayHref} />
    </div>
  );
}
