"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ProfileSwitcher } from "@/components/profile/ProfileSwitcher";
import { ActiveProfileLabel } from "@/components/profile/ActiveProfileLabel";
import { DiaryPastTagButtons } from "@/components/journal/DiaryPastTagButtons";
import { DiaryTagInputField } from "@/components/journal/DiaryTagInput";
import { JournalListSwipeRow } from "@/components/journal/JournalListSwipeRow";
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
import {
  LJD_PAPER_CARD_CLASS,
  LJD_PAPER_INPUT_CLASS,
  LJD_PAPER_LINK_CLASS,
  LJD_PAPER_PRIMARY_BTN_CLASS,
  LJD_PAPER_SECONDARY_BTN_CLASS,
  LJD_PAPER_SELECTED_CLASS,
  LJD_PAPER_CHIP_IDLE_CLASS,
} from "@/lib/ljd/ljdPaperSurface";
import { TERM_FOOTPRINT_LEDGER } from "@/lib/journal/footprintTerminology";

const JOURNAL_LIST_DELETE_CONFIRM = "このあしあとを本当に削除しますか？" as const;

type ProfileOption = { id: string; nickname: string };

type Props = {
  profiles: ProfileOption[];
  activeProfileId: string;
  activeProfileNickname: string;
};

const listSelectClass =
  `min-h-[44px] w-full appearance-none ${LJD_PAPER_INPUT_CLASS} bg-[length:12px] bg-[right_0.75rem_center] bg-no-repeat px-3 py-2 pr-9 text-base disabled:opacity-60`;
const listSelectStyle = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%2378716c' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
} as const;

type JournalSearchScope = "month" | "year" | "all";

async function fetchJournalList(params: {
  profileId: string;
  monthKey: string;
  year: number;
  searchScope: JournalSearchScope;
  keyword: string;
  tag: string;
}): Promise<JournalListEntry[]> {
  const qs = new URLSearchParams({
    profileId: params.profileId,
    view: "list",
    _: String(Date.now()),
  });

  const hasSearch = Boolean(params.keyword.trim() || params.tag.trim());
  if (hasSearch) {
    qs.set("searchScope", params.searchScope);
    if (params.searchScope === "month") {
      qs.set("month", params.monthKey);
    } else if (params.searchScope === "year") {
      qs.set("year", String(params.year));
    }
    if (params.keyword.trim()) qs.set("q", params.keyword.trim());
    if (params.tag.trim()) qs.set("tag", params.tag.trim());
  } else {
    qs.set("month", params.monthKey);
  }

  const res = await fetch(`/api/journal?${qs.toString()}`, {
    cache: "no-store",
    credentials: "same-origin",
  });
  const data = (await res.json()) as { entries?: JournalListEntry[]; error?: string };
  if (!res.ok) throw new Error(data.error ?? "あしあと一覧の取得に失敗しました。");
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
  const [searchScope, setSearchScope] = useState<JournalSearchScope>("month");
  const [keywordQuery, setKeywordQuery] = useState("");
  const [tagQuery, setTagQuery] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedTag, setAppliedTag] = useState("");
  const [appliedSearchScope, setAppliedSearchScope] = useState<JournalSearchScope>("month");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
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

  const loadEntries = useCallback(
    async (targetMonth: Date, profileId: string, search: {
      active: boolean;
      keyword: string;
      tag: string;
      scope: JournalSearchScope;
    }) => {
      const generation = ++fetchGenerationRef.current;
      const key = monthKeyFromDateAnchor(targetMonth);
      setLoading(true);
      setError(null);
      try {
        const rows = await fetchJournalList({
          profileId,
          monthKey: key,
          year: targetMonth.getFullYear(),
          searchScope: search.active ? search.scope : "month",
          keyword: search.active ? search.keyword : "",
          tag: search.active ? search.tag : "",
        });
        if (generation !== fetchGenerationRef.current) return;
        setEntries(rows);
        setOpenSwipeId(null);
        setDeleteError(null);
        setHasLoadedOnce(true);
      } catch (e) {
        if (generation !== fetchGenerationRef.current) return;
        setError(e instanceof Error ? e.message : "あしあと一覧の取得に失敗しました。");
        setEntries([]);
      } finally {
        if (generation === fetchGenerationRef.current) {
          setLoading(false);
        }
      }
    },
    [],
  );

  const deleteEntry = useCallback(async (entryId: string) => {
    if (deletingId) return;
    const ok = window.confirm(JOURNAL_LIST_DELETE_CONFIRM);
    if (!ok) {
      setOpenSwipeId(null);
      return;
    }
    setDeletingId(entryId);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/journal/${encodeURIComponent(entryId)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "削除に失敗しました。");
      }
      setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
      setOpenSwipeId(null);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "削除に失敗しました。");
      setOpenSwipeId(null);
    } finally {
      setDeletingId(null);
    }
  }, [deletingId]);

  const applySearch = useCallback(() => {
    const nextKeyword = keywordQuery.trim();
    const nextTag = tagQuery.trim();
    if (!nextKeyword && !nextTag) {
      setIsSearchActive(false);
      setAppliedKeyword("");
      setAppliedTag("");
      setAppliedSearchScope("month");
      void loadEntries(viewMonth, effectiveProfileId, {
        active: false,
        keyword: "",
        tag: "",
        scope: "month",
      });
      return;
    }
    setIsSearchActive(true);
    setAppliedKeyword(nextKeyword);
    setAppliedTag(nextTag);
    setAppliedSearchScope(searchScope);
    void loadEntries(viewMonth, effectiveProfileId, {
      active: true,
      keyword: nextKeyword,
      tag: nextTag,
      scope: searchScope,
    });
  }, [effectiveProfileId, keywordQuery, loadEntries, searchScope, tagQuery, viewMonth]);

  const clearSearch = useCallback(() => {
    setKeywordQuery("");
    setTagQuery("");
    setIsSearchActive(false);
    setAppliedKeyword("");
    setAppliedTag("");
    setAppliedSearchScope("month");
    setSearchScope("month");
    void loadEntries(viewMonth, effectiveProfileId, {
      active: false,
      keyword: "",
      tag: "",
      scope: "month",
    });
  }, [effectiveProfileId, loadEntries, viewMonth]);

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
    void loadEntries(viewMonth, effectiveProfileId, {
      active: isSearchActive,
      keyword: appliedKeyword,
      tag: appliedTag,
      scope: appliedSearchScope,
    });
  }, [
    appliedKeyword,
    appliedSearchScope,
    appliedTag,
    effectiveProfileId,
    isSearchActive,
    loadEntries,
    viewMonth,
  ]);

  useEffect(() => {
    const urlMonth = parseMonthKeyParam(searchParams.get("month"));
    if (!urlMonth) return;
    const urlAnchor = monthAnchorFromMonthKey(urlMonth);
    setViewMonth((current) => {
      if (monthKeyFromDateAnchor(urlAnchor) === monthKeyFromDateAnchor(current)) return current;
      return urlAnchor;
    });
  }, [searchParams]);

  const loadingLabel = !hasLoadedOnce ? "あしあと帳を読み込み中…" : "あしあとを読み込み中…";

  const emptyMessage = isSearchActive
    ? "条件に合うあしあとは見つかりませんでした。"
    : "この月のあしあとはまだありません。";

  const searchScopeLabel =
    appliedSearchScope === "all"
      ? "全期間"
      : appliedSearchScope === "year"
        ? `${selectedYear}年`
        : `${selectedYear}年${selectedMonth}月`;

  return (
    <div>
      <div className="space-y-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-[#3f3428] sm:text-2xl">{TERM_FOOTPRINT_LEDGER}</h1>
            <InlineHelpButton ariaLabel="あしあと帳の説明" panelZIndexClass="z-50">
              {JOURNAL_LIST_HELP_TEXT}
            </InlineHelpButton>
          </div>
          <ActiveProfileLabel nickname={effectiveProfileNickname} className="mt-2" />
          <button
            type="button"
            onClick={() => setShowProfilePanel((v) => !v)}
            className={`mt-2 text-sm ${LJD_PAPER_LINK_CLASS}`}
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
          className={`${LJD_PAPER_CARD_CLASS} px-3 py-3`}
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

          <fieldset className="mt-3 border-t border-[#ebe2d4] pt-3">
            <legend className="text-sm font-medium text-[#4a3a28]">あしあとを探す</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  { id: "month" as const, label: "この月" },
                  { id: "year" as const, label: "この年" },
                  { id: "all" as const, label: "全期間" },
                ] as const
              ).map((option) => (
                <label
                  key={option.id}
                  className={[
                    "inline-flex min-h-[40px] cursor-pointer items-center rounded-lg border px-3 py-2 text-sm",
                    searchScope === option.id
                      ? LJD_PAPER_SELECTED_CLASS
                      : LJD_PAPER_CHIP_IDLE_CLASS,
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="journal-list-search-scope"
                    value={option.id}
                    checked={searchScope === option.id}
                    onChange={() => setSearchScope(option.id)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
            <label className="mt-3 block">
              <span className="sr-only">キーワード</span>
              <input
                type="search"
                value={keywordQuery}
                onChange={(e) => setKeywordQuery(e.target.value)}
                placeholder="キーワード（本文）"
                autoComplete="off"
                className={`w-full px-3 py-2.5 text-base ${LJD_PAPER_INPUT_CLASS}`}
              />
            </label>
            <div className="mt-2">
              <label htmlFor="journal-list-tag-search" className="sr-only">
                タグ
              </label>
              <DiaryTagInputField
                id="journal-list-tag-search"
                value={tagQuery}
                onChange={setTagQuery}
                inputType="search"
              />
            </div>
            <DiaryPastTagButtons
              profileId={effectiveProfileId}
              onSelectTag={setTagQuery}
              className="mt-3"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applySearch()}
                className={`min-h-[44px] px-4 py-2 text-sm font-medium ${LJD_PAPER_PRIMARY_BTN_CLASS}`}
              >
                検索
              </button>
              {isSearchActive ? (
                <button
                  type="button"
                  onClick={() => clearSearch()}
                  className={`min-h-[44px] px-4 py-2 text-sm font-medium ${LJD_PAPER_SECONDARY_BTN_CLASS}`}
                >
                  検索をクリア
                </button>
              ) : null}
            </div>
            {isSearchActive ? (
              <p className="mt-2 text-xs text-stone-500">
                {searchScopeLabel}で検索中
                {appliedKeyword ? ` · キーワード「${appliedKeyword}」` : ""}
                {appliedTag ? ` · タグ「${appliedTag}」` : ""}
              </p>
            ) : null}
          </fieldset>
        </div>

        {loading ? (
          <div className="flex min-h-[10rem] items-center justify-center">
            <OwlLoadingInline label={loadingLabel} size="md" className="text-sm text-stone-600" />
          </div>
        ) : error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        ) : sortedEntries.length === 0 ? (
          <div className={`lj-read-desc ${LJD_PAPER_CARD_CLASS} p-5 text-[#5c4a35]`}>
            <p>{emptyMessage}</p>
            {!isSearchActive ? (
              <p className="mt-2 lj-read-caption text-stone-500">
                上の年・月を変えると、別の月のあしあとを表示できます。
              </p>
            ) : null}
            {!isSearchActive ? (
              <Link
                href="/orders/calendar"
                className={`mt-3 inline-flex min-h-[44px] items-center text-base ${LJD_PAPER_LINK_CLASS}`}
              >
                カレンダーからあしあとを書く
              </Link>
            ) : null}
          </div>
        ) : (
          <>
            <p className="mb-2 text-xs text-stone-500">
              行を左にスワイプすると、あしあとを削除できます。
            </p>
            {deleteError ? (
              <p className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {deleteError}
              </p>
            ) : null}
            <ul className={`divide-y divide-[#ebe2d4] ${LJD_PAPER_CARD_CLASS} overflow-hidden`}>
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
                    <JournalListSwipeRow
                      href={previewHref}
                      open={openSwipeId === entry.id}
                      onOpenChange={(nextOpen) => {
                        setOpenSwipeId(nextOpen ? entry.id : null);
                      }}
                      deleting={deletingId === entry.id}
                      onDelete={() => void deleteEntry(entry.id)}
                    >
                      <span className="lj-read-desc w-[5.5rem] shrink-0 font-medium text-[#5c4a35]">
                        {dayLabel}
                      </span>
                      {photoUrl ? (
                        <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-[#e0d2bc]/90 bg-[#f3ead8]/80">
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
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-dashed border-[#e0d2bc]/90 bg-[#f7efe3]/80 text-[#c5b089]"
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
                      <span className="lj-read-diary min-w-0 flex-1 leading-snug text-[#3f3428] line-clamp-1">
                        {previewLine}
                      </span>
                    </JournalListSwipeRow>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
