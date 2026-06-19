"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ProfileSwitcher } from "@/components/profile/ProfileSwitcher";
import { ActiveProfileLabel } from "@/components/profile/ActiveProfileLabel";
import { InlineHelpButton } from "@/components/ui/InlineHelpButton";
import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";
import { JOURNAL_LIST_HELP_TEXT } from "@/lib/journal/journalDiaryNumbersHelpCopy";
import {
  formatJournalListDayLabel,
  journalEntryListPreviewLine,
  type JournalListEntry,
} from "@/lib/journal/journalListDisplay";
import {
  currentMonthAnchorInJapan,
  currentYearInJapan,
  journalListMonthOptions,
  journalListPathForMonth,
  journalListYearOptions,
  journalPreviewPath,
  monthAnchorFromMonthKey,
  monthAnchorFromYearMonth,
  monthKeyFromDateAnchor,
  parseMonthKeyParam,
} from "@/lib/journal/journalNav";

type ProfileOption = { id: string; nickname: string };

type Props = {
  profiles: ProfileOption[];
  activeProfileId: string;
  activeProfileNickname: string;
};

const listSelectClass =
  "min-h-[44px] w-full appearance-none rounded-lg border border-stone-300 bg-white bg-[length:12px] bg-[right_0.75rem_center] bg-no-repeat px-3 py-2 pr-9 text-base text-stone-900 outline-none ring-stone-400 focus:ring-2 disabled:opacity-60";
const listSelectStyle = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%2378716c' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
} as const;

async function fetchJournalListMonth(
  profileId: string,
  monthKey: string,
): Promise<JournalListEntry[]> {
  const qs = new URLSearchParams({
    profileId,
    view: "list",
    month: monthKey,
    _: String(Date.now()),
  });
  const res = await fetch(`/api/journal?${qs.toString()}`, {
    cache: "no-store",
    credentials: "same-origin",
  });
  const data = (await res.json()) as { entries?: JournalListEntry[]; error?: string };
  if (!res.ok) throw new Error(data.error ?? "日記一覧の取得に失敗しました。");
  return data.entries ?? [];
}

export function DiaryJournalListHome({
  profiles,
  activeProfileId,
  activeProfileNickname,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMonthKey = parseMonthKeyParam(searchParams.get("month"));
  const [viewMonth, setViewMonth] = useState(() =>
    initialMonthKey ? monthAnchorFromMonthKey(initialMonthKey) : currentMonthAnchorInJapan(),
  );
  const [effectiveProfileId, setEffectiveProfileId] = useState(activeProfileId);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [entries, setEntries] = useState<JournalListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchGenerationRef = useRef(0);

  const monthKey = useMemo(() => monthKeyFromDateAnchor(viewMonth), [viewMonth]);
  const returnTo = useMemo(() => journalListPathForMonth(monthKey), [monthKey]);
  const selectedYear = viewMonth.getFullYear();
  const selectedMonth = viewMonth.getMonth() + 1;
  const yearOptions = useMemo(() => {
    const years = journalListYearOptions(Math.max(currentYearInJapan(), selectedYear));
    if (!years.includes(selectedYear)) {
      return [selectedYear, ...years].sort((a, b) => b - a);
    }
    return years;
  }, [selectedYear]);
  const monthOptions = useMemo(() => journalListMonthOptions(), []);

  const effectiveProfileNickname = useMemo(() => {
    return profiles.find((p) => p.id === effectiveProfileId)?.nickname ?? activeProfileNickname;
  }, [profiles, effectiveProfileId, activeProfileNickname]);

  const sortedEntries = useMemo(
    () =>
      [...entries].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [entries],
  );

  const loadMonth = useCallback(async (targetMonth: Date, profileId: string) => {
    const generation = ++fetchGenerationRef.current;
    const key = monthKeyFromDateAnchor(targetMonth);
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchJournalListMonth(profileId, key);
      if (generation !== fetchGenerationRef.current) return;
      setEntries(rows);
      setHasLoadedOnce(true);
    } catch (e) {
      if (generation !== fetchGenerationRef.current) return;
      setError(e instanceof Error ? e.message : "日記一覧の取得に失敗しました。");
      setEntries([]);
    } finally {
      if (generation === fetchGenerationRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const syncMonthInUrl = useCallback(
    (key: string) => {
      const current = parseMonthKeyParam(searchParams.get("month"));
      if (current === key) return;
      router.replace(journalListPathForMonth(key), { scroll: false });
    },
    [router, searchParams],
  );

  const applyYearMonth = useCallback(
    (year: number, monthOneBased: number) => {
      const next = monthAnchorFromYearMonth(year, monthOneBased);
      const key = monthKeyFromDateAnchor(next);
      setViewMonth(next);
      syncMonthInUrl(key);
    },
    [syncMonthInUrl],
  );

  useEffect(() => {
    setEffectiveProfileId(activeProfileId);
  }, [activeProfileId]);

  useEffect(() => {
    if (!effectiveProfileId) return;
    void loadMonth(viewMonth, effectiveProfileId);
  }, [effectiveProfileId, loadMonth, viewMonth]);

  useEffect(() => {
    const urlMonth = parseMonthKeyParam(searchParams.get("month"));
    if (!urlMonth) return;
    const urlAnchor = monthAnchorFromMonthKey(urlMonth);
    setViewMonth((current) => {
      if (monthKeyFromDateAnchor(urlAnchor) === monthKeyFromDateAnchor(current)) return current;
      return urlAnchor;
    });
  }, [searchParams]);

  const loadingLabel = !hasLoadedOnce ? "日記一覧を読み込み中…" : "日記を読み込み中…";

  return (
    <div>
      <div className="space-y-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-stone-900 sm:text-2xl">日記一覧</h1>
            <InlineHelpButton ariaLabel="日記一覧の説明" panelZIndexClass="z-50">
              {JOURNAL_LIST_HELP_TEXT}
            </InlineHelpButton>
          </div>
          <ActiveProfileLabel nickname={effectiveProfileNickname} className="mt-2" />
          <button
            type="button"
            onClick={() => setShowProfilePanel((v) => !v)}
            className="mt-2 text-sm font-medium text-emerald-900 underline-offset-2 hover:underline"
            aria-expanded={showProfilePanel}
            aria-controls="list-profile-switcher"
          >
            プロフィールを切り替える
          </button>
        </div>

        {showProfilePanel ? (
          <div id="list-profile-switcher">
            <ProfileSwitcher profiles={profiles} activeProfileId={effectiveProfileId} />
          </div>
        ) : null}

        <div
          className="rounded-xl border border-stone-200 bg-white px-3 py-3 shadow-sm"
          aria-busy={loading}
        >
          <div className="flex gap-2">
            <label className="min-w-0 flex-1">
              <span className="sr-only">表示する年</span>
              <select
                aria-label="表示する年"
                value={selectedYear}
                disabled={loading}
                onChange={(e) => applyYearMonth(Number(e.target.value), selectedMonth)}
                className={listSelectClass}
                style={listSelectStyle}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}年
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-0 flex-1">
              <span className="sr-only">表示する月</span>
              <select
                aria-label="表示する月"
                value={selectedMonth}
                disabled={loading}
                onChange={(e) => applyYearMonth(selectedYear, Number(e.target.value))}
                className={listSelectClass}
                style={listSelectStyle}
              >
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[10rem] items-center justify-center">
            <OwlLoadingInline label={loadingLabel} size="md" className="text-sm text-stone-600" />
          </div>
        ) : error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        ) : sortedEntries.length === 0 ? (
          <div className="lj-read-desc rounded-xl border border-stone-200 bg-white p-5 text-stone-600 shadow-sm">
            <p>この月の日記はまだありません。</p>
            <p className="mt-2 lj-read-caption text-stone-500">上の年・月を変えると、別の月の日記を表示できます。</p>
            <Link
              href="/orders/calendar"
              className="mt-3 inline-flex min-h-[44px] items-center text-base font-medium text-emerald-900 underline-offset-2 hover:underline"
            >
              カレンダーから日記を書く
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white shadow-sm">
            {sortedEntries.map((entry) => {
              const previewHref = journalPreviewPath(
                entry.id,
                entry.designTheme,
                returnTo,
                effectiveProfileId,
              );
              const previewLine = journalEntryListPreviewLine(entry.content);
              const dayLabel = formatJournalListDayLabel(entry.createdAt);
              const photoUrl = entry.hasPhoto
                ? `/api/journal/entries/${encodeURIComponent(entry.id)}/photo`
                : null;

              return (
                <li key={entry.id}>
                  <Link
                    href={previewHref}
                    className="flex min-h-[56px] items-center gap-3 px-3 py-3.5 transition active:bg-stone-50/80"
                  >
                    <span className="lj-read-desc w-[5.5rem] shrink-0 font-medium text-stone-700">
                      {dayLabel}
                    </span>
                    {photoUrl ? (
                      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md border border-stone-200 bg-stone-100">
                        <Image
                          src={photoUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="44px"
                          unoptimized
                        />
                      </span>
                    ) : (
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-dashed border-stone-200/80 bg-stone-50/80 text-stone-300"
                        aria-hidden
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className="h-4 w-4"
                        >
                          <rect x="3" y="5" width="18" height="14" rx="2" />
                          <circle cx="8.5" cy="10.5" r="1.5" />
                          <path d="m21 16-5.5-5.5L5 21" />
                        </svg>
                      </span>
                    )}
                    <span className="lj-read-diary min-w-0 flex-1 leading-snug text-stone-800 line-clamp-1">
                      {previewLine}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
