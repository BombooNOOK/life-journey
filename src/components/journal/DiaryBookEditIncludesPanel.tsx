"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { DiaryBookIncludeInBookMonthList } from "@/components/journal/DiaryBookIncludeInBookMonthList";
import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";
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
      const data = (await res.json()) as {
        entries?: DiaryBookIncludePickerEntryDto[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "一覧の取得に失敗しました。");
      setEntries(data.entries ?? []);
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
      const data = (await res.json()) as { error?: string; entryCount?: number };
      if (!res.ok) throw new Error(data.error ?? "日記ブックの更新に失敗しました。");
      setRefreshNotice(
        `日記ブックを更新しました（${data.entryCount ?? 0}件の日記を反映）。`,
      );
      router.push(`/orders/bookshelf/diary-book/${bookId}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "日記ブックの更新に失敗しました。");
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
        <h1 className="mt-2 text-2xl font-bold text-stone-900">本に入れる日記を編集する</h1>
        <p className="mt-1 text-sm text-stone-600">{rangeLabel}</p>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          チェックの変更を保存したあと、「日記ブックを更新する」でこの本の本文・月索引・ページ数に反映されます。
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-stone-500">日記一覧を読み込み中…</p>
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
          onSaved={({ entries: next }) => {
            setEntries(next);
            setIncludeDirty(false);
          }}
          onDirtyChange={setIncludeDirty}
        />
      ) : null}

      {!loading && entries && entries.length === 0 ? (
        <p className="text-sm text-stone-500">この期間に日記がありません。</p>
      ) : null}

      <section className="rounded-xl border border-stone-200 bg-stone-50/80 p-4">
        <h2 className="text-sm font-semibold text-stone-900">日記ブックを更新する</h2>
        <p className="mt-1 text-xs leading-relaxed text-stone-600">
          掲載の変更を保存したあとに押してください。新しく書いた日記を追加した場合も、ここで本に反映できます。
        </p>
        <button
          type="button"
          disabled={refreshing || loading || includeDirty}
          aria-busy={refreshing}
          onClick={() => void refreshDiaryBook()}
          className="mt-3 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-50"
        >
          {refreshing ? (
            <OwlLoadingInline label="日記ブックを更新しています…" size="sm" />
          ) : (
            "日記ブックを更新する"
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
