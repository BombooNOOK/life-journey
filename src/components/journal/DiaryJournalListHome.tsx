"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { DiaryHomeBottomNav } from "@/components/journal/DiaryHomeBottomNav";
import { ProfileSwitcher } from "@/components/profile/ProfileSwitcher";
import { ActiveProfileLabel } from "@/components/profile/ActiveProfileLabel";
import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";
import { journalPreviewPath } from "@/lib/journal/journalNav";
import {
  formatJournalListDayLabel,
  groupJournalEntriesByMonth,
  journalEntryListPreviewLine,
  type JournalListEntry,
} from "@/lib/journal/journalListDisplay";

type ProfileOption = { id: string; nickname: string };

type Props = {
  profiles: ProfileOption[];
  activeProfileId: string;
  activeProfileNickname: string;
};

async function fetchJournalList(profileId: string): Promise<JournalListEntry[]> {
  const qs = new URLSearchParams({
    profileId,
    view: "list",
    _: String(Date.now()),
  });
  const res = await fetch(`/api/journal?${qs.toString()}`, {
    cache: "no-store",
    credentials: "same-origin",
  });
  const data = (await res.json()) as { entries?: JournalListEntry[]; error?: string };
  if (!res.ok) throw new Error(data.error ?? "記録一覧の取得に失敗しました。");
  return data.entries ?? [];
}

export function DiaryJournalListHome({
  profiles,
  activeProfileId,
  activeProfileNickname,
}: Props) {
  const [effectiveProfileId, setEffectiveProfileId] = useState(activeProfileId);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [entries, setEntries] = useState<JournalListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const effectiveProfileNickname = useMemo(() => {
    return profiles.find((p) => p.id === effectiveProfileId)?.nickname ?? activeProfileNickname;
  }, [profiles, effectiveProfileId, activeProfileNickname]);

  const monthGroups = useMemo(() => groupJournalEntriesByMonth(entries), [entries]);
  const returnTo = "/orders/list";

  const loadList = useCallback(async (profileId: string) => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchJournalList(profileId);
      setEntries(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "記録一覧の取得に失敗しました。");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setEffectiveProfileId(activeProfileId);
  }, [activeProfileId]);

  useEffect(() => {
    if (!effectiveProfileId) return;
    void loadList(effectiveProfileId);
  }, [effectiveProfileId, loadList]);

  return (
    <div className="pb-24">
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900 sm:text-2xl">日記一覧</h1>
          <ActiveProfileLabel nickname={effectiveProfileNickname} className="mt-2" />
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            月ごとの記録一覧です。項目をタップすると、読みやすいプレビューが開きます。
          </p>
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

        {loading ? (
          <div className="flex min-h-[10rem] items-center justify-center">
            <OwlLoadingInline label="記録一覧を読み込み中…" size="md" className="text-sm text-stone-600" />
          </div>
        ) : error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        ) : monthGroups.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white p-5 text-sm text-stone-600 shadow-sm">
            <p>まだ記録がありません。</p>
            <Link
              href="/orders/calendar"
              className="mt-3 inline-flex min-h-[44px] items-center text-base font-medium text-emerald-900 underline-offset-2 hover:underline"
            >
              カレンダーから記録を書く
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {monthGroups.map((group) => (
              <section key={group.monthKey} aria-labelledby={`list-month-${group.monthKey}`}>
                <h2
                  id={`list-month-${group.monthKey}`}
                  className="sticky top-0 z-[1] border-b border-stone-200/80 bg-[#faf8f5]/95 py-2 text-base font-semibold text-stone-800 backdrop-blur-sm"
                >
                  {group.monthLabel}
                </h2>
                <ul className="divide-y divide-stone-100">
                  {group.entries.map((entry) => {
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
                          className="flex min-h-[56px] items-center gap-3 py-3.5 pr-1 transition active:bg-stone-50/80"
                        >
                          <span className="w-[5.5rem] shrink-0 text-sm font-medium text-stone-700">
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
                          <span className="min-w-0 flex-1 text-base leading-snug text-stone-800 line-clamp-2">
                            {previewLine}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      <DiaryHomeBottomNav />
    </div>
  );
}
