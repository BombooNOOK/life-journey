"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { DiaryBookIncludeInBookMonthList } from "@/components/journal/DiaryBookIncludeInBookMonthList";
import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";
import { parseFetchJsonResponse } from "@/lib/http/parseFetchJson";
import type { DiaryBookIncludePickerEntryDto } from "@/lib/journal/diaryBookIncludePicker";
import { NO_INCLUDED_ENTRIES_IN_DIARY_BOOK_PERIOD_MESSAGE } from "@/lib/journal/diaryBookPeriod";

type PreviewResponse = {
  entryCount?: number;
  totalEntryCount?: number;
  canUpdate?: boolean;
  message?: string;
  entries?: DiaryBookIncludePickerEntryDto[];
  error?: string;
  code?: string;
};

type Props = {
  bookId: string;
  bookTitle: string;
  initialStartDate: string;
  initialEndDate: string;
  currentRangeLabel: string;
};

const DEFAULT_NO_ENTRIES_MESSAGE =
  "この期間には日記がありません。\n期間を変更するか、日記を書いてから日記ブックを作成してください。";

export function DiaryBookEditPeriodPanel({
  bookId,
  bookTitle,
  initialStartDate,
  initialEndDate,
  currentRangeLabel,
}: Props) {
  const router = useRouter();
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [entryCount, setEntryCount] = useState<number | null>(null);
  const [canUpdate, setCanUpdate] = useState(false);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);
  const [pickerEntries, setPickerEntries] = useState<DiaryBookIncludePickerEntryDto[] | null>(
    null,
  );
  const [periodChecked, setPeriodChecked] = useState(false);
  const [includeDirty, setIncludeDirty] = useState(false);
  const [periodUpdated, setPeriodUpdated] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateNotice, setUpdateNotice] = useState<string | null>(null);

  const canPreview = Boolean(startDate && endDate);
  const canSubmit =
    canPreview && periodChecked && canUpdate && !updating && !includeDirty && !periodUpdated;

  const resetPreview = useCallback(() => {
    setEntryCount(null);
    setCanUpdate(false);
    setPreviewMessage(null);
    setPickerEntries(null);
    setPeriodChecked(false);
    setIncludeDirty(false);
    setPeriodUpdated(false);
    setUpdateNotice(null);
  }, []);

  async function checkPreview() {
    if (!canPreview) return;
    setChecking(true);
    setError(null);
    setPreviewMessage(null);
    setPickerEntries(null);
    setPeriodChecked(false);
    setUpdateNotice(null);
    try {
      const res = await fetch(
        `/api/journal/diary-books/${encodeURIComponent(bookId)}/period/preview`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ startDate, endDate }),
        },
      );
      const data = await parseFetchJsonResponse<PreviewResponse>(
        res,
        "対象日記の確認に失敗しました。",
      );
      if (!res.ok) {
        setEntryCount(null);
        setCanUpdate(false);
        setError(data.error ?? "対象日記の確認に失敗しました。");
        return;
      }
      const count = Number.isFinite(data.entryCount) ? Number(data.entryCount) : 0;
      const list = Array.isArray(data.entries) ? data.entries : [];
      const updatable = data.canUpdate === true && count > 0;
      setEntryCount(count);
      setCanUpdate(updatable);
      setPickerEntries(list.length > 0 ? list : null);
      setPeriodChecked(true);
      if (!updatable) {
        setPreviewMessage(data.message ?? DEFAULT_NO_ENTRIES_MESSAGE);
      } else {
        setPreviewMessage(null);
      }
    } catch (e) {
      setEntryCount(null);
      setCanUpdate(false);
      setError(e instanceof Error ? e.message : "対象日記の確認に失敗しました。");
    } finally {
      setChecking(false);
    }
  }

  async function updatePeriod() {
    if (!canSubmit) return;
    setUpdating(true);
    setError(null);
    setUpdateNotice(null);
    try {
      const res = await fetch(`/api/journal/diary-books/${encodeURIComponent(bookId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ startDate, endDate }),
      });
      const data = await parseFetchJsonResponse<{ error?: string }>(
        res,
        "対象期間の更新に失敗しました。",
      );
      if (!res.ok) {
        setError(data.error ?? "対象期間の更新に失敗しました。");
        return;
      }
      setPeriodUpdated(true);
      setUpdateNotice(
        "対象期間を更新しました。下の「日記ブックを更新する」で表紙・本文に反映してください。",
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "対象期間の更新に失敗しました。");
    } finally {
      setUpdating(false);
    }
  }

  async function refreshDiaryBook() {
    if (!periodUpdated || includeDirty || refreshing) return;
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/journal/diary-books/${encodeURIComponent(bookId)}/refresh`,
        { method: "POST", credentials: "same-origin" },
      );
      const data = await parseFetchJsonResponse<{ error?: string; entryCount?: number }>(
        res,
        "日記ブックの更新に失敗しました。",
      );
      if (!res.ok) {
        throw new Error(data.error ?? "日記ブックの更新に失敗しました。");
      }
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
        <h1 className="mt-2 text-2xl font-bold text-stone-900">対象期間を変更する</h1>
        <p className="mt-1 text-sm text-stone-600">現在：{currentRangeLabel}</p>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          開始日・終了日を変更すると、対象になる日記の範囲が変わります。以前除外した日記（本に入れない設定）は自動では戻りません。
        </p>
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
      ) : null}
      {updateNotice ? (
        <div className="space-y-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-950">
          <p>{updateNotice}</p>
        </div>
      ) : null}

      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-900">対象期間</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-stone-700">開始日</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                resetPreview();
              }}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-stone-700">終了日</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                resetPreview();
              }}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
          {entryCount == null ? (
            "変更後の日記は、確認後に表示されます。"
          ) : (
            <>
              本に入れる日記（候補）：{" "}
              <span className="font-semibold text-stone-900">{entryCount}件</span>
            </>
          )}
        </div>

        {periodChecked && pickerEntries && pickerEntries.length > 0 ? (
          <div className="mt-4">
            <p className="mb-2 text-xs text-stone-500">
              「本に入れる」がオフの日記は、このままでは本に載りません。必要なら更新後に編集画面でオンにしてください。
            </p>
            <DiaryBookIncludeInBookMonthList
              entries={pickerEntries}
              onSaved={({ includedCount, entries }) => {
                setPickerEntries(entries);
                setEntryCount(includedCount);
                setCanUpdate(includedCount > 0);
                setIncludeDirty(false);
                setPreviewMessage(
                  includedCount > 0 ? null : NO_INCLUDED_ENTRIES_IN_DIARY_BOOK_PERIOD_MESSAGE,
                );
              }}
              onDirtyChange={setIncludeDirty}
            />
          </div>
        ) : null}

        {previewMessage ? (
          <p className="mt-3 whitespace-pre-line rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {previewMessage}
          </p>
        ) : null}

        {!periodUpdated ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!canPreview || checking || updating}
              onClick={() => void checkPreview()}
              className="min-h-[44px] rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-100 disabled:opacity-50"
            >
              {checking ? (
                <OwlLoadingInline label="確認中…" size="sm" />
              ) : (
                "変更後の日記を確認"
              )}
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => void updatePeriod()}
              className="min-h-[44px] rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-50"
            >
              {updating ? (
                <OwlLoadingInline label="更新中…" size="sm" />
              ) : (
                "この内容で更新する"
              )}
            </button>
          </div>
        ) : null}
        {includeDirty && !periodUpdated ? (
          <p className="mt-2 text-xs text-amber-800">
            未保存のチェック変更があります。先に「選択を保存する」を押してください。
          </p>
        ) : null}
      </section>

      {periodUpdated ? (
        <section className="rounded-xl border border-stone-200 bg-stone-50/80 p-4">
          <h2 className="text-sm font-semibold text-stone-900">日記ブックを更新する</h2>
          <p className="mt-1 text-xs leading-relaxed text-stone-600">
            対象期間の変更を表紙・月索引・本文に反映します。完了すると日記ブックの表紙画面に戻ります。
          </p>
          <button
            type="button"
            disabled={refreshing || includeDirty}
            aria-busy={refreshing}
            onClick={() => void refreshDiaryBook()}
            className="mt-3 min-h-[44px] rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-50"
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
