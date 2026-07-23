"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { DiaryBookIncludeInBookMonthList } from "@/components/journal/DiaryBookIncludeInBookMonthList";
import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";
import { OwlLoadingPanel } from "@/components/ui/OwlLoadingPanel";
import { parseFetchJsonResponse } from "@/lib/http/parseFetchJson";
import type { DiaryBookIncludePickerEntryDto } from "@/lib/journal/diaryBookIncludePicker";

type Props = {
  bookId: string;
  bookTitle: string;
  rangeLabel: string;
};

export function DiaryBookEditIncludesPanel({ bookId, bookTitle, rangeLabel }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<DiaryBookIncludePickerEntryDto[] | null>(null);
  const [tagScopeSummary, setTagScopeSummary] = useState<string | null>(null);
  const [pageTemplate, setPageTemplate] = useState<string | null>(null);
  const [matchingEntryCount, setMatchingEntryCount] = useState<number | null>(null);
  const [includedCount, setIncludedCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [includeDirty, setIncludeDirty] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);

  const loadPicker = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/journal/diary-books/${encodeURIComponent(bookId)}/include-picker?_=${Date.now()}`,
        { cache: "no-store", credentials: "same-origin" },
      );
      const data = await parseFetchJsonResponse<{
        entries?: DiaryBookIncludePickerEntryDto[];
        matchingEntryCount?: number;
        includedCount?: number;
        book?: { tagScopeSummary?: string | null; pageTemplate?: string | null };
        error?: string;
      }>(res, "一覧の取得に失敗しました。");
      if (!res.ok) throw new Error(data.error ?? "一覧の取得に失敗しました。");
      setEntries(data.entries ?? []);
      setTagScopeSummary(data.book?.tagScopeSummary ?? null);
      setPageTemplate(data.book?.pageTemplate ?? null);
      setMatchingEntryCount(
        Number.isFinite(data.matchingEntryCount) ? Number(data.matchingEntryCount) : null,
      );
      setIncludedCount(Number.isFinite(data.includedCount) ? Number(data.includedCount) : null);
      setIncludeDirty(false);
    } catch (e) {
      setEntries(null);
      setError(e instanceof Error ? e.message : "一覧の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    void loadPicker();
  }, [loadPicker]);

  async function refreshDiaryBook() {
    setRefreshing(true);
    setRefreshNotice(null);
    setError(null);
    try {
      const res = await fetch(
        `/api/journal/diary-books/${encodeURIComponent(bookId)}/refresh`,
        { method: "POST", credentials: "same-origin" },
      );
      const data = await parseFetchJsonResponse<{ error?: string; entryCount?: number }>(
        res,
        "あしあとブックの更新に失敗しました。",
      );
      if (!res.ok) throw new Error(data.error ?? "あしあとブックの更新に失敗しました。");
      setRefreshNotice(
        `あしあとブックを更新しました（${data.entryCount ?? 0}件のあしあとを反映）。`,
      );
      router.push(`/orders/bookshelf/diary-book/${bookId}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "あしあとブックの更新に失敗しました。");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/orders/bookshelf/diary-book/${bookId}`}
          className="text-sm text-stone-600 hover:text-stone-900"
        >
          ← {bookTitle}を読む
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">本に入れるあしあとを選ぶ</h1>
        <p className="mt-1 text-sm text-stone-600">{rangeLabel}</p>
        {tagScopeSummary ? (
          <p className="mt-1 text-sm text-stone-600">タグ条件：{tagScopeSummary}</p>
        ) : null}
        {matchingEntryCount != null && includedCount != null ? (
          <p className="mt-1 text-sm text-stone-600">
            条件に合うあしあと：{matchingEntryCount}件 / 本に入れるあしあと：{includedCount}件
          </p>
        ) : null}
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          チェックの変更を保存したあと、「あしあとブックを更新する」でこの本の本文・月索引・ページ数に反映されます。
          タグ条件そのものを変える場合は
          <Link
            href={`/orders/bookshelf/diary-book/${bookId}/edit-tags`}
            className="mx-1 font-medium text-emerald-900 underline-offset-2 hover:underline"
          >
            タグ条件を変更
          </Link>
          から行ってください。
        </p>
      </div>

      {loading ? (
        <OwlLoadingPanel layout="inline" label="あしあと一覧を読み込んでいます…" size="sm" />
      ) : null}
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
      ) : null}
      {refreshNotice ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {refreshNotice}
        </p>
      ) : null}

      {entries && entries.length > 0 ? (
        <DiaryBookIncludeInBookMonthList
          entries={entries}
          pageTemplate={pageTemplate}
          onSaved={({ entries: next }) => {
            setEntries(next);
            setIncludeDirty(false);
          }}
          onDirtyChange={setIncludeDirty}
        />
      ) : null}

      {!loading && entries && entries.length === 0 ? (
        <p className="text-sm text-stone-500">この期間にあしあとがありません。</p>
      ) : null}

      <section className="rounded-xl border border-stone-200 bg-stone-50/80 p-4">
        <h2 className="text-sm font-semibold text-stone-900">あしあとブックを更新する</h2>
        <p className="mt-1 text-xs leading-relaxed text-stone-600">
          掲載の変更を保存したあとに押してください。新しく書いたあしあとを追加した場合も、ここで本に反映できます。
        </p>
        <button
          type="button"
          disabled={refreshing || loading || includeDirty}
          aria-busy={refreshing}
          onClick={() => void refreshDiaryBook()}
          className="mt-3 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-50"
        >
          {refreshing ? (
            <OwlLoadingInline label="あしあとブックを更新しています…" size="sm" />
          ) : (
            "あしあとブックを更新する"
          )}
        </button>
        {includeDirty ? (
          <p className="mt-2 text-xs text-amber-800">
            未保存のチェック変更があります。先に「選択を保存する」を押してください。
          </p>
        ) : null}
      </section>

      <Link
        href="/orders/bookshelf"
        className="inline-block text-sm text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline"
      >
        本棚へ戻る
      </Link>
    </div>
  );
}
