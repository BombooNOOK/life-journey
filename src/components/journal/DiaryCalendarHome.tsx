"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CompanionWritingCalendarCompleteCard } from "@/components/journal/companion-writing/CompanionWritingCalendarCompleteCard";
import { CompanionWritingCalendarRevealOverlay } from "@/components/journal/companion-writing/CompanionWritingCalendarRevealOverlay";
import { CompanionWritingForestDeliveryOverlay } from "@/components/journal/companion-writing/CompanionWritingForestDeliveryOverlay";
import { DiarySyncDebugPanel } from "@/components/journal/DiarySyncDebugPanel";
import {
  DiaryMonthCalendar,
  type DiaryMonthCalendarEntry,
} from "@/components/journal/DiaryMonthCalendar";
import { DonguriWriteEntryLink } from "@/components/loghouse/DonguriWriteEntryLink";
import { ProfileSwitcher } from "@/components/profile/ProfileSwitcher";
import { useEnsureServerAuthSession } from "@/hooks/useEnsureServerAuthSession";
import { canShowAdminProfileSwitchUi } from "@/lib/profile/viewerProfileUiPolicy";
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
import { MoodOwlIcon } from "@/components/journal/MoodOwlIcon";
import { getActivityMeta, getMoodMeta } from "@/lib/journal/meta";
import {
  clearCompanionWritingCalendarComplete,
  readCompanionWritingCalendarComplete,
} from "@/lib/journal/companionWriting/session";
import type { CompanionWritingCalendarCompletePayload } from "@/lib/journal/companionWriting/session";
import { preloadCompanionSaveForestAssets } from "@/lib/journal/companionWriting/companionSaveForestAssets";
import { getAppraiserDisplayName } from "@/lib/journal/companionWriting/messages";
import {
  COMPANION_WRITING_CALENDAR_GUIDE_QUERY,
  COMPANION_WRITING_CALENDAR_REVEAL_MS,
  COMPANION_WRITING_FOREST_DELIVERY_MS,
  companionWritingSaveLoadingLabel,
  parseCompanionWritingCalendarGuidePhase,
  type CompanionWritingCalendarGuidePhase,
} from "@/lib/journal/companionWriting/types";
import { TrialStatusBanner } from "@/components/entitlement/TrialStatusBanner";
import type { SerializedUserEntitlement } from "@/lib/entitlement/resolveUserEntitlement";
import { LOG_HOUSE_BACK_LINK } from "@/lib/journal/logHouseLabels";
import {
  LJD_PAPER_CARD_CLASS,
  LJD_PAPER_LINK_CLASS,
  LJD_PAPER_PRIMARY_BTN_CLASS,
  LJD_PAPER_SECONDARY_BTN_CLASS,
} from "@/lib/ljd/ljdPaperSurface";

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
  entitlement: SerializedUserEntitlement;
  viewerIsAdmin?: boolean;
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
  if (!res.ok) throw new Error(data.error ?? "あしあとの取得に失敗しました。");
  return data.entries ?? [];
}

async function fetchDraftDateKeys(monthKey: string, profileId: string): Promise<string[]> {
  const qs = new URLSearchParams({
    month: monthKey,
    profileId,
  });
  const res = await fetch(`/api/journal/drafts?${qs.toString()}`, {
    cache: "no-store",
    credentials: "same-origin",
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { draftDateKeys?: string[] };
  return Array.isArray(data.draftDateKeys) ? data.draftDateKeys : [];
}

function formatSelectedDayLabel(year: number, monthIndex: number, day: number): string {
  return `${year}年${monthIndex + 1}月${day}日`;
}

export function DiaryCalendarHome({
  profiles,
  activeProfileId,
  activeProfileNickname,
  entitlement,
  viewerIsAdmin = false,
}: Props) {
  const canWriteJournal =
    entitlement.canUseContinuedFeatures || entitlement.canCreateFirstJournal;
  const canEditJournal = entitlement.canUseContinuedFeatures;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const listRef = useRef<HTMLDivElement>(null);
  const authSession = useEnsureServerAuthSession();
  const showSyncDebug = searchParams.get("syncDebug") === "1";
  const debugDay = searchParams.get("debugDay");
  const debugEntryId = searchParams.get("debugEntry");
  const [effectiveProfileId, setEffectiveProfileId] = useState(activeProfileId);
  const showAdminProfileUi = canShowAdminProfileSwitchUi({
    isAdmin: viewerIsAdmin,
    profileCount: profiles.length,
  });

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
  const [draftDateKeys, setDraftDateKeys] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProfileSwitch, setShowProfileSwitch] = useState(false);
  const companionGuideFromUrl = useMemo(
    () =>
      parseCompanionWritingCalendarGuidePhase(
        searchParams.get(COMPANION_WRITING_CALENDAR_GUIDE_QUERY),
      ),
    [searchParams],
  );

  const [companionComplete, setCompanionComplete] =
    useState<CompanionWritingCalendarCompletePayload | null>(() => {
      if (!companionGuideFromUrl) return null;
      return readCompanionWritingCalendarComplete();
    });
  const fetchGenerationRef = useRef(0);
  const calendarRevealStartedAtRef = useRef<number | null>(null);

  const buildCalendarHref = useCallback(
    (cwGuide?: CompanionWritingCalendarGuidePhase | null) => {
      const qs = new URLSearchParams(searchParams.toString());
      if (cwGuide) qs.set(COMPANION_WRITING_CALENDAR_GUIDE_QUERY, cwGuide);
      else qs.delete(COMPANION_WRITING_CALENDAR_GUIDE_QUERY);
      const q = qs.toString();
      return q ? `${pathname}?${q}` : pathname;
    },
    [pathname, searchParams],
  );

  const companionGuidePhase = useMemo((): CompanionWritingCalendarGuidePhase | null => {
    if (!companionComplete) return null;
    return parseCompanionWritingCalendarGuidePhase(
      searchParams.get(COMPANION_WRITING_CALENDAR_GUIDE_QUERY),
    );
  }, [companionComplete, searchParams]);

  const dismissCompanionGuide = useCallback(() => {
    clearCompanionWritingCalendarComplete();
    setCompanionComplete(null);
    if (searchParams.get(COMPANION_WRITING_CALENDAR_GUIDE_QUERY)) {
      router.replace(buildCalendarHref(null), { scroll: false });
    }
  }, [buildCalendarHref, router, searchParams]);

  const monthKey = useMemo(() => toMonthKey(viewMonth), [viewMonth]);
  const calendarLoadingLabel = !hasLoadedOnce
    ? "カレンダーを読み込み中です…"
    : companionWritingSaveLoadingLabel(
        getAppraiserDisplayName(companionComplete?.companionType ?? "owl"),
      );
  const CALENDAR_FETCH_ERROR =
    "あしあとを読み込めませんでした。時間をおいて再度お試しください。";
  const returnToBase = useMemo(() => {
    const qs = new URLSearchParams();
    if (selectedDay !== null) {
      qs.set("day", calendarDayKeyFromParts(viewMonth.getFullYear(), viewMonth.getMonth(), selectedDay));
    }
    const q = qs.toString();
    return q ? `/orders/calendar?${q}` : "/orders/calendar";
  }, [viewMonth, selectedDay]);

  useEffect(() => {
    if (!companionGuideFromUrl) {
      clearCompanionWritingCalendarComplete();
      setCompanionComplete(null);
      return;
    }

    const payload = readCompanionWritingCalendarComplete();
    if (!payload) return;

    setCompanionComplete((current) => current ?? payload);
    void preloadCompanionSaveForestAssets();
    const day = parseDayParam(payload.entryDateYmd);
    if (day) {
      setViewMonth(new Date(day.year, day.monthIndex, 1));
      setSelectedDay(day.day);
    }
  }, [companionGuideFromUrl]);

  const companionCalendarRevealReady =
    companionGuidePhase === "calendar" && !isFetching;

  useEffect(() => {
    if (companionGuidePhase !== "calendar") {
      calendarRevealStartedAtRef.current = null;
      return;
    }
    if (!companionCalendarRevealReady) return;

    if (calendarRevealStartedAtRef.current === null) {
      calendarRevealStartedAtRef.current = Date.now();
    }

    const elapsed = Date.now() - calendarRevealStartedAtRef.current;
    const remaining = Math.max(0, COMPANION_WRITING_CALENDAR_REVEAL_MS - elapsed);

    const timer = window.setTimeout(() => {
      router.replace(buildCalendarHref("forest"), { scroll: false });
    }, remaining);
    return () => window.clearTimeout(timer);
  }, [buildCalendarHref, companionCalendarRevealReady, companionGuidePhase, router]);

  useEffect(() => {
    if (companionGuidePhase !== "forest") return;
    const timer = window.setTimeout(() => {
      router.replace(buildCalendarHref("actions"), { scroll: false });
    }, COMPANION_WRITING_FOREST_DELIVERY_MS);
    return () => window.clearTimeout(timer);
  }, [buildCalendarHref, companionGuidePhase, router]);

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
    async (
      targetMonth: Date,
      opts?: { clearSelection?: boolean; quiet?: boolean },
    ) => {
      const generation = ++fetchGenerationRef.current;
      const key = toMonthKey(targetMonth);
      if (!opts?.quiet) setIsFetching(true);
      setError(null);
      try {
        const [list, drafts] = await Promise.all([
          fetchJournalMonth(key, effectiveProfileId),
          fetchDraftDateKeys(key, effectiveProfileId),
        ]);
        if (generation !== fetchGenerationRef.current) return;
        setViewMonth(targetMonth);
        setEntries(list);
        setDraftDateKeys(drafts);
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

  const companionGuideQuietFetch =
    companionGuideFromUrl !== null || companionGuidePhase !== null;

  useEffect(() => {
    if (!authSession.ready) return;
    void loadMonthFor(viewMonth, {
      clearSelection: false,
      quiet: companionGuideQuietFetch,
    });
  }, [
    authSession.ready,
    companionGuideQuietFetch,
    effectiveProfileId,
    loadMonthFor,
    viewMonth,
  ]);

  useEffect(() => {
    const reload = () => {
      if (!authSession.ready) return;
      void loadMonthFor(viewMonth, {
        clearSelection: false,
        quiet: companionGuideQuietFetch,
      });
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
  }, [authSession.ready, companionGuideQuietFetch, loadMonthFor, viewMonth]);

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

  const draftDays = useMemo(() => {
    const days = new Set<number>();
    const prefix = `${monthKey}-`;
    for (const key of draftDateKeys) {
      if (!key.startsWith(prefix)) continue;
      const day = Number(key.slice(-2));
      if (Number.isFinite(day)) days.add(day);
    }
    return days;
  }, [draftDateKeys, monthKey]);

  const selectedDayHasDraft =
    selectedDayKey !== null && draftDateKeys.includes(selectedDayKey);

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

  const profileNameButtonClass = LJD_PAPER_LINK_CLASS;
  const writeButtonBase =
    "flex min-h-[44px] w-[92%] max-w-[360px] items-center justify-center px-4 py-2.5 text-center text-sm font-semibold sm:min-h-[46px] sm:w-auto sm:min-w-[12rem] sm:max-w-[17rem]";
  const writeTodayButtonClass = `${writeButtonBase} ${LJD_PAPER_PRIMARY_BTN_CLASS}`;
  const writeSelectedDayButtonClass = `${writeButtonBase} rounded-xl border border-[#8a9470]/90 bg-[#6e7c57] text-white shadow-[0_2px_8px_rgba(90,70,45,0.1)] transition hover:bg-[#5f6c4a]`;

  const awaitingCompanionBootstrap =
    companionGuideFromUrl !== null && companionComplete === null;

  const companionGuideBlocksCalendar =
    awaitingCompanionBootstrap ||
    (companionComplete !== null &&
      (companionGuidePhase === "calendar" || companionGuidePhase === "forest"));

  return (
    <div>
      {(companionComplete && companionGuidePhase === "calendar") ||
      (awaitingCompanionBootstrap && companionGuideFromUrl === "calendar") ? (
        <CompanionWritingCalendarRevealOverlay
          cursorMonth={viewMonth}
          entries={entries}
          selectedDay={selectedDay}
          isFetching={isFetching || awaitingCompanionBootstrap}
          companionType={companionComplete?.companionType ?? "owl"}
        />
      ) : null}

      {companionComplete && companionGuidePhase === "forest" ? (
        <CompanionWritingForestDeliveryOverlay companionType={companionComplete.companionType} />
      ) : null}

      {companionComplete && companionGuidePhase === "actions" ? (
        <CompanionWritingCalendarCompleteCard
          payload={companionComplete}
          calendarReturnTo={returnToBase}
          onDismiss={dismissCompanionGuide}
          onCleared={() => setCompanionComplete(null)}
        />
      ) : null}

      <div
        className={
          companionGuideBlocksCalendar
            ? "pointer-events-none select-none opacity-0"
            : "space-y-1.5 sm:space-y-4"
        }
        aria-hidden={companionGuideBlocksCalendar ? true : undefined}
      >
        <div className="max-sm:pt-0 sm:space-y-2">
          <Link
            href="/orders"
            className="hidden text-sm text-stone-600 hover:text-stone-900 sm:inline"
          >
            {LOG_HOUSE_BACK_LINK.label}
          </Link>
          <h1 className="mt-0 hidden text-xl font-bold leading-snug text-[#3f3428] sm:mt-2 sm:block sm:text-2xl">
            {showAdminProfileUi ? (
              <button
                type="button"
                onClick={() => setShowProfileSwitch((v) => !v)}
                className={`${LJD_PAPER_LINK_CLASS} underline-offset-4`}
                aria-expanded={showProfileSwitch}
                aria-controls="diary-profile-switcher"
              >
                【{effectiveProfileNickname}】
              </button>
            ) : null}
            Life Journey Diary
          </h1>
          {showAdminProfileUi ? (
            <p
              className="flex min-w-0 items-baseline gap-0.5 text-xs leading-snug sm:hidden"
              title={`管理者用記録枠：${effectiveProfileNickname}`}
            >
              <span className="shrink-0 text-stone-500">記録枠：</span>
              <button
                type="button"
                onClick={() => setShowProfileSwitch((v) => !v)}
                className={profileNameButtonClass}
                aria-expanded={showProfileSwitch}
                aria-controls="diary-profile-switcher"
              >
                {effectiveProfileNickname}
              </button>
            </p>
          ) : (
            <p className="text-xs leading-snug text-stone-500 sm:hidden">あしあとのカレンダー</p>
          )}
        </div>

        {showAdminProfileUi && showProfileSwitch ? (
          <div id="diary-profile-switcher">
            <ProfileSwitcher
              profiles={profiles}
              activeProfileId={effectiveProfileId}
              viewerIsAdmin={viewerIsAdmin}
            />
          </div>
        ) : null}

        {authSession.mismatch ? (
          <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            ログイン情報の同期にずれがあります。一度ログアウトしてから再ログインしてください。
          </p>
        ) : null}

        <TrialStatusBanner entitlement={entitlement} />

        {showSyncDebug ? (
          <DiarySyncDebugPanel
            monthKey={monthKey}
            profileId={effectiveProfileId}
            authSession={authSession}
            debugDay={debugDay}
            debugEntryId={debugEntryId}
          />
        ) : null}

        <div className="relative space-y-2">
          <DiaryMonthCalendar
            cursorMonth={viewMonth}
            entries={entries}
            draftDays={draftDays}
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
          {canWriteJournal ? (
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
              <DonguriWriteEntryLink
                href={journalTodayHref}
                dateKey={todayDayKey}
                profileId={effectiveProfileId}
                className={writeTodayButtonClass}
              >
                今日のあしあとを書く
              </DonguriWriteEntryLink>
              {showSelectedDayWriteButton && journalSelectedHref && selectedDayKey ? (
                <DonguriWriteEntryLink
                  href={journalSelectedHref}
                  dateKey={selectedDayKey}
                  profileId={effectiveProfileId}
                  className={writeSelectedDayButtonClass}
                >
                  選択した日のあしあとを書く
                </DonguriWriteEntryLink>
              ) : null}
            </div>
          ) : (
            <p className="rounded-lg border border-violet-200 bg-violet-50/70 px-3 py-2 text-center text-sm text-violet-950">
              新しいあしあとを森に残す操作は、いまご利用いただけません。どんぐりと森の定期便のご案内をご確認ください。下の一覧から過去のあしあとを読むことができます。
            </p>
          )}
        </div>

        <div ref={listRef} className="scroll-mt-4 space-y-3">
          {selectedDay === null ? (
            <p className="rounded-xl border border-dashed border-[#e0d2bc]/90 bg-[#f7efe3]/70 px-4 py-6 text-center text-sm text-[#8a7b6a]">
              日付をタップすると、その日のあしあとがここに表示されます。
            </p>
          ) : (
            <>
              <h2 className="text-base font-semibold text-[#3f3428]">
                {formatSelectedDayLabel(
                  viewMonth.getFullYear(),
                  viewMonth.getMonth(),
                  selectedDay,
                )}
                のあしあと
                <span className="ml-2 text-sm font-normal text-[#8a7b6a]">
                  {selectedDayEntries.length}件
                </span>
              </h2>

              {selectedDayHasDraft ? (
                <div
                  className={`${LJD_PAPER_CARD_CLASS} border-dashed border-[#c4a574]/90 bg-[#faf3e4]/90 px-4 py-3 text-sm text-[#5c4a35]`}
                >
                  <p className="font-medium text-[#8a6b3d]">この日に書きかけの下書きがあります</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#7a6856]">
                    「あしあとを書く」から続けると、下書きを復元できます。
                  </p>
                </div>
              ) : null}

              {selectedDayEntries.length === 0 ? (
                <div className={`${LJD_PAPER_CARD_CLASS} px-4 py-6 text-center text-sm text-[#5c4a35]`}>
                  <p>
                    {selectedDayHasDraft
                      ? "正式なあしあとはまだありません（下書きのみ）。"
                      : "この日のあしあとはまだありません。"}
                  </p>
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
                        className={`${LJD_PAPER_CARD_CLASS} p-3`}
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
                            <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-700">
                              <MoodOwlIcon moodId={entry.mood} sizePx={20} className="shrink-0" />
                              <span>
                                {mood.label} · {activity.label}
                              </span>
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
                            href={journalPreviewPath(
                              entry.id,
                              entry.designTheme,
                              returnToBase,
                              effectiveProfileId,
                            )}
                            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-[#a8b08f]/90 bg-[#eef1e4] px-3 py-2 text-sm font-medium text-[#4a5440] hover:bg-[#e4e9d8] sm:flex-none sm:px-4"
                          >
                            {canEditJournal ? "プレビュー" : "読む"}
                          </Link>
                          {canEditJournal ? (
                            <Link
                              href={journalEditPath(entry.id, returnToBase, effectiveProfileId)}
                              className={`inline-flex min-h-[44px] flex-1 items-center justify-center px-3 py-2 text-sm font-medium sm:flex-none sm:px-4 ${LJD_PAPER_SECONDARY_BTN_CLASS}`}
                            >
                              編集
                            </Link>
                          ) : (
                            <span className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-400 sm:flex-none sm:px-4">
                              編集不可
                            </span>
                          )}
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
    </div>
  );
}
