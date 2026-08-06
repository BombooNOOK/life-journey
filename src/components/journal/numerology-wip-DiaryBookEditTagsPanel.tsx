"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { DiaryBookTagFilterFields } from "@/components/journal/DiaryBookTagFilterFields";
import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";
import { parseFetchJsonResponse } from "@/lib/http/parseFetchJson";
import type { DiaryBookTagFilterMode } from "@/lib/journal/diaryTags";

type PreviewResponse = {
  entryCount?: number;
  matchingEntryCount?: number;
  canUpdate?: boolean;
  message?: string;
  error?: string;
  code?: string;
};

type Props = {
  bookId: string;
  bookTitle: string;
  rangeLabel: string;
  initialTagFilter: string;
  initialTagFilterMode: DiaryBookTagFilterMode;
};

export function DiaryBookEditTagsPanel({
  bookId,
  bookTitle,
  rangeLabel,
  initialTagFilter,
  initialTagFilterMode,
}: Props) {
  const router = useRouter();
  const [tagFilter, setTagFilter] = useState(initialTagFilter);
  const [tagFilterMode, setTagFilterMode] = useState<DiaryBookTagFilterMode>(initialTagFilterMode);
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [matchingEntryCount, setMatchingEntryCount] = useState<number | null>(null);
  const [entryCount, setEntryCount] = useState<number | null>(null);
  const [canUpdate, setCanUpdate] = useState(false);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);
  const [previewChecked, setPreviewChecked] = useState(false);
  const [tagsUpdated, setTagsUpdated] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateNotice, setUpdateNotice] = useState<string | null>(null);

  const resetPreview = useCallback(() => {
    setMatchingEntryCount(null);
    setEntryCount(null);
    setCanUpdate(false);
    setPreviewMessage(null);
    setPreviewChecked(false);
    setTagsUpdated(false);
    setUpdateNotice(null);
  }, []);

  async function checkPreview() {
    setChecking(true);
    setError(null);
    setPreviewMessage(null);
    setPreviewChecked(false);
    try {
      const res = await fetch(
        `/api/journal/diary-books/${encodeURIComponent(bookId)}/tags/preview`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ tagFilter, tagFilterMode }),
        },
      );
      const data = await parseFetchJsonResponse<PreviewResponse>(
        res,
        "タグ条件の確認に失敗しました。",
      );
      if (!res.ok) {
        setMatchingEntryCount(null);
        setEntryCount(null);
        setCanUpdate(false);
        setError(data.error ?? "タグ条件の確認に失敗しました。");
        return;
      }
      const matching = Number.isFinite(data.matchingEntryCount)
        ? Number(data.matchingEntryCount)
        : 0;
      const included = Number.isFinite(data.entryCount) ? Number(data.entryCount) : 0;
      const updatable = data.canUpdate === true && included > 0;
      setMatchingEntryCount(matching);
      setEntryCount(included);
      setCanUpdate(updatable);
      setPreviewChecked(true);
      setPreviewMessage(updatable ? null : (data.message ?? null));
    } catch (e) {
      setMatchingEntryCount(null);
      setEntryCount(null);
      setCanUpdate(false);
      setError(e instanceof Error ? e.message : "タグ条件の確認に失敗しました。");
    } finally {
      setChecking(false);
    }
  }

  async function updateTags() {
    if (!canUpdate || !previewChecked) return;
    setUpdating(true);
    setError(null);
    setUpdateNotice(null);
    try {
      const res = await fetch(`/api/journal/diary-books/${encodeURIComponent(bookId)}/tags`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ tagFilter, tagFilterMode }),
      });
      const data = await parseFetchJsonResponse<{ error?: string }>(
        res,
        "タグ条件の更新に失敗しました。",
      );
      if (!res.ok) {
        setError(data.error ?? "タグ条件の更新に失敗しました。");
        return;
      }
      setTagsUpdated(true);
      setUpdateNotice(
        "タグ条件を更新しました。下の「あしあとブックを更新する」で表紙・本文に反映してください。",
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "タグ条件の更新に失敗しました。");
    } finally {
      setUpdating(false);
    }
  }

  async function refreshDiaryBook() {
    if (!tagsUpdated || refreshing) return;
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/journal/diary-books/${encodeURIComponent(bookId)}/refresh`,
        { method: "POST", credentials: "same-origin" },
      );
      const data = await parseFetchJsonResponse<{ error?: string }>(
        res,
        "あしあとブックの更新に失敗しました。",
      );
      if (!res.ok) {
        throw new Error(data.error ?? "あしあとブックの更新に失敗しました。");
      }
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
        <h1 className="mt-2 text-2xl font-bold text-stone-900">タグ条件を変更する</h1>
        <p className="mt-1 text-sm text-stone-600">{rangeLabel}</p>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          タグ条件は、このあしあとブックに載せるあしあとの候補を絞り込むための設定です。「本に入れる」チェックは自動では変わりません。
        </p>
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
      ) : null}
      {updateNotice ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-950">
          {updateNotice}
        </div>
      ) : null}

      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <DiaryBookTagFilterFields
          tagFilter={tagFilter}
          tagFilterMode={tagFilterMode}
          onTagFilterChange={(value) => {
            setTagFilter(value);
            resetPreview();
          }}
          onTagFilterModeChange={(mode) => {
            setTagFilterMode(mode);
            resetPreview();
          }}
          disabled={tagsUpdated}
          idPrefix="edit-tags"
        />

        <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
          {matchingEntryCount == null || entryCount == null ? (
            "変更後のあしあとは、確認後に表示されます。"
          ) : (
            <>
              条件に合うあしあと：{" "}
              <span className="font-semibold text-stone-900">{matchingEntryCount}件</span>
              <span className="mx-2 text-stone-400">/</span>
              本に入れるあしあと：{" "}
              <span className="font-semibold text-stone-900">{entryCount}件</span>
            </>
          )}
        </div>

        {previewMessage ? (
          <p className="mt-3 whitespace-pre-line rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {previewMessage}
          </p>
        ) : null}

        {!tagsUpdated ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={checking || updating}
              onClick={() => void checkPreview()}
              className="min-h-[44px] rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-100 disabled:opacity-50"
            >
              {checking ? (
                <OwlLoadingInline label="確認中…" size="sm" />
              ) : (
                "変更後のあしあとを確認"
              )}
            </button>
            <button
              type="button"
              disabled={!previewChecked || !canUpdate || updating}
              onClick={() => void updateTags()}
              className="min-h-[44px] rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-50"
            >
              {updating ? <OwlLoadingInline label="更新中…" size="sm" /> : "この内容で更新する"}
            </button>
          </div>
        ) : null}
      </section>

      {tagsUpdated ? (
        <section className="rounded-xl border border-stone-200 bg-stone-50/80 p-4">
          <h2 className="text-sm font-semibold text-stone-900">あしあとブックを更新する</h2>
          <p className="mt-1 text-xs leading-relaxed text-stone-600">
            タグ条件の変更を表紙・月索引・本文に反映します。完了するとあしあとブックの表紙画面に戻ります。
          </p>
          <button
            type="button"
            disabled={refreshing}
            aria-busy={refreshing}
            onClick={() => void refreshDiaryBook()}
            className="mt-3 min-h-[44px] rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-50"
          >
            {refreshing ? (
              <OwlLoadingInline label="あしあとブックを更新しています…" size="sm" />
            ) : (
              "あしあとブックを更新する"
            )}
          </button>
        </section>
      ) : null}

      <Link
        href="/orders/bookshelf"
        className="inline-block text-sm text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline"
      >
        本棚へ戻る
      </Link>
    </div>
  );
}
