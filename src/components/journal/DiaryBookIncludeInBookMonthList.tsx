"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";
import {
  groupDiaryBookIncludePickerEntriesByMonth,
  type DiaryBookIncludePickerEntryDto,
  diaryBookIncludePickerDateLabel,
} from "@/lib/journal/diaryBookIncludePicker";
import { parseFetchJsonResponse } from "@/lib/http/parseFetchJson";
import { MoodOwlIcon } from "@/components/journal/MoodOwlIcon";
import { getMoodMeta } from "@/lib/journal/meta";
import { parseSafeJournalReturnTo } from "@/lib/journal/bookshelfReturnTo";

type SavedPayload = {
  includedCount: number;
  entries: DiaryBookIncludePickerEntryDto[];
};

type Props = {
  entries: DiaryBookIncludePickerEntryDto[];
  onSaved: (payload: SavedPayload) => void;
  onDirtyChange?: (dirty: boolean) => void;
  /** あしあと編集から戻る先。省略時は現在の path（許可リスト内のみ） */
  editReturnTo?: string;
  profileId?: string;
  /** あしあとブックのページテンプレ。編集リンクに付与し、枠容量ヒントに使う */
  pageTemplate?: string | null;
};

function includeSnapshot(entries: DiaryBookIncludePickerEntryDto[]): string {
  return entries.map((e) => `${e.id}:${e.includeInBook ? "1" : "0"}`).join("|");
}

function lengthHintLabel(flag: DiaryBookIncludePickerEntryDto["lengthFlag"]): string | null {
  if (flag === "ok") return null;
  return "はみ出し注意";
}

function journalEditHref(params: {
  entryId: string;
  returnTo: string | null;
  profileId?: string;
  pageTemplate?: string | null;
}): string {
  const qs = new URLSearchParams();
  qs.set("edit", params.entryId);
  if (params.profileId) qs.set("profile", params.profileId);
  if (params.returnTo) qs.set("returnTo", params.returnTo);
  const template = params.pageTemplate?.trim();
  if (template) qs.set("pageTemplate", template);
  return `/journal?${qs.toString()}`;
}

export function DiaryBookIncludeInBookMonthList({
  entries: initialEntries,
  onSaved,
  onDirtyChange,
  editReturnTo,
  profileId,
  pageTemplate,
}: Props) {
  const pathname = usePathname();
  const [entries, setEntries] = useState(initialEntries);
  const [savedSnapshot, setSavedSnapshot] = useState(() => includeSnapshot(initialEntries));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const safeReturnTo = useMemo(
    () => parseSafeJournalReturnTo(editReturnTo ?? pathname),
    [editReturnTo, pathname],
  );

  const overflowIncludedCount = useMemo(
    () =>
      entries.filter((e) => e.includeInBook && e.lengthFlag !== "ok").length,
    [entries],
  );

  useEffect(() => {
    setEntries(initialEntries);
    setSavedSnapshot(includeSnapshot(initialEntries));
    setError(null);
    setNotice(null);
  }, [initialEntries]);

  const dirty = useMemo(
    () => includeSnapshot(entries) !== savedSnapshot,
    [entries, savedSnapshot],
  );

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const monthlyBuckets = useMemo(
    () => groupDiaryBookIncludePickerEntriesByMonth(entries),
    [entries],
  );

  const includedCount = useMemo(
    () => entries.filter((entry) => entry.includeInBook).length,
    [entries],
  );

  const setEntryInclude = useCallback((id: string, includeInBook: boolean) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, includeInBook } : entry)),
    );
    setNotice(null);
  }, []);

  const setMonthInclude = useCallback((ids: string[], includeInBook: boolean) => {
    const idSet = new Set(ids);
    setEntries((prev) =>
      prev.map((entry) => (idSet.has(entry.id) ? { ...entry, includeInBook } : entry)),
    );
    setNotice(null);
  }, []);

  const saveChanges = useCallback(async () => {
    if (!dirty) return;
    setSaving(true);
    setError(null);
    setNotice(null);

    const savedById = new Map<string, boolean>();
    for (const part of savedSnapshot.split("|")) {
      if (!part) continue;
      const [id, flag] = part.split(":");
      if (id) savedById.set(id, flag === "1");
    }

    const idsToOn: string[] = [];
    const idsToOff: string[] = [];
    for (const entry of entries) {
      const was = savedById.get(entry.id);
      if (was === undefined || was === entry.includeInBook) continue;
      if (entry.includeInBook) idsToOn.push(entry.id);
      else idsToOff.push(entry.id);
    }

    try {
      const requests: Promise<Response>[] = [];
      if (idsToOn.length > 0) {
        requests.push(
          fetch("/api/journal/include", {
            method: "PATCH",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: idsToOn, includeInBook: true }),
          }),
        );
      }
      if (idsToOff.length > 0) {
        requests.push(
          fetch("/api/journal/include", {
            method: "PATCH",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: idsToOff, includeInBook: false }),
          }),
        );
      }
      const results = await Promise.all(requests);
      for (const res of results) {
        const data = await parseFetchJsonResponse<{ error?: string }>(
          res,
          "掲載設定の保存に失敗しました。",
        );
        if (!res.ok) {
          throw new Error(data.error ?? "掲載設定の保存に失敗しました。");
        }
      }
      const nextSnapshot = includeSnapshot(entries);
      setSavedSnapshot(nextSnapshot);
      setNotice("選択を保存しました。");
      onSaved({
        includedCount: entries.filter((e) => e.includeInBook).length,
        entries,
      });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "保存に失敗しました。時間をおいて再度お試しください。",
      );
    } finally {
      setSaving(false);
    }
  }, [dirty, entries, onSaved, savedSnapshot]);

  if (entries.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3 rounded-xl border border-emerald-200/80 bg-white p-4 shadow-sm">
      <div>
        <h3 className="text-base font-semibold text-stone-900">本に入れるあしあとを選ぶ</h3>
        <p className="mt-1 text-sm leading-relaxed text-stone-600">
          あしあととしてはすべて保存されています。ここでは、あしあとブックや製本に入れるあしあとだけを選べます。
        </p>
      </div>

      {overflowIncludedCount > 0 ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-relaxed text-amber-950">
          本に入れるあしあとのうち {overflowIncludedCount}{" "}
          件が、選んだ文字サイズだとページからはみ出す可能性があります。「はみ出し注意」から文字サイズや文章を直せます。直したあと、この画面に戻って確認し直せます。
        </p>
      ) : null}

      <div className="space-y-4">
        {monthlyBuckets.map((bucket) => {
          const monthAllIncluded = bucket.entries.every((entry) => entry.includeInBook);
          const monthAllExcluded = bucket.entries.every((entry) => !entry.includeInBook);
          return (
          <div key={bucket.key}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-stone-900">{bucket.label}</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
                  disabled={saving || monthAllIncluded}
                  onClick={() => setMonthInclude(bucket.entries.map((e) => e.id), true)}
                >
                  この月をすべて入れる
                </button>
                <button
                  type="button"
                  className="rounded-md border border-stone-300 bg-white px-2 py-1 text-xs text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                  disabled={saving || monthAllExcluded}
                  onClick={() => setMonthInclude(bucket.entries.map((e) => e.id), false)}
                >
                  この月をすべて外す
                </button>
              </div>
            </div>
            {monthAllIncluded ? (
              <p className="mb-2 text-xs text-stone-500">
                この月のあしあとはすでにすべて選択されています。
              </p>
            ) : null}
            <ul className="space-y-2">
              {bucket.entries.map((entry) => {
                const mood = getMoodMeta(entry.mood);
                const lengthLabel = lengthHintLabel(entry.lengthFlag);
                return (
                  <li
                    key={entry.id}
                    className="flex items-start gap-2 rounded-lg border border-stone-200 bg-stone-50/60 px-3 py-2.5"
                  >
                    <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={entry.includeInBook}
                        disabled={saving}
                        onChange={(e) => setEntryInclude(entry.id, e.target.checked)}
                        className="mt-0.5 h-5 w-5 shrink-0 rounded border-stone-300 text-emerald-700 focus:ring-emerald-600"
                        aria-label={`${diaryBookIncludePickerDateLabel(entry.createdAt)}のあしあとを本に入れる`}
                      />
                      <span className="min-w-0 text-sm text-stone-800">
                        <span className="font-medium text-stone-900">
                          {diaryBookIncludePickerDateLabel(entry.createdAt)}
                        </span>
                        <span className="ml-1.5 inline-flex items-center gap-1.5 text-stone-700">
                          <MoodOwlIcon moodId={entry.mood} sizePx={18} className="shrink-0" />
                          {mood.label}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-stone-600">
                          {entry.contentExcerpt}
                        </span>
                        {entry.hasPhoto || lengthLabel ? (
                          <span className="mt-1 flex flex-wrap items-center gap-1.5">
                            {entry.hasPhoto ? (
                              <span className="rounded bg-stone-200/80 px-1.5 py-0.5 text-[10px] font-medium text-stone-700">
                                写真あり
                              </span>
                            ) : null}
                            {lengthLabel ? (
                              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-900">
                                {lengthLabel}
                              </span>
                            ) : null}
                            {lengthLabel && safeReturnTo ? (
                              <Link
                                href={journalEditHref({
                                  entryId: entry.id,
                                  returnTo: safeReturnTo,
                                  profileId,
                                  pageTemplate,
                                })}
                                className="rounded border border-amber-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-amber-950 underline-offset-2 hover:bg-amber-50 hover:underline"
                              >
                                文字サイズを直す
                              </Link>
                            ) : null}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
          );
        })}
      </div>

      <p className="text-xs text-stone-500">
        本に入れるあしあと:{" "}
        <span className="font-semibold text-stone-800">{includedCount}件</span>
        {dirty ? "（未保存の変更があります）" : null}
      </p>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {notice}
        </p>
      ) : null}

      <div className="space-y-2">
        <button
          type="button"
          disabled={!dirty || saving}
          aria-busy={saving}
          onClick={() => void saveChanges()}
          className="w-full rounded-lg border border-emerald-700 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-900 hover:bg-emerald-100 disabled:opacity-50 sm:w-auto"
        >
          {saving ? (
            <OwlLoadingInline label="選択を保存しています…" size="sm" />
          ) : (
            "選択を保存する"
          )}
        </button>
        {!dirty && !saving ? (
          <p className="text-xs text-stone-600">
            変更はありません。現在の選択内容は保存済みです。
          </p>
        ) : null}
      </div>
    </section>
  );
}
