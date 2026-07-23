"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AshiatoPageShapePicker } from "@/components/orders/AshiatoPageShapePicker";
import { DiaryBookIncludeInBookMonthList } from "@/components/journal/DiaryBookIncludeInBookMonthList";
import { TAG_INPUT_PLACEHOLDER } from "@/components/journal/DiaryTagInput";
import {
  ashiatoCoverOptions,
  diaryCoverImagePath,
  type AshiatoCoverId,
} from "@/lib/journal/coverAssets";
import {
  DEFAULT_ASHIATO_PAGE_TEMPLATE_ID,
  type AshiatoPageTemplateId,
} from "@/lib/journal/ashiatoPageTemplates";
import type { DiaryBookIncludePickerEntryDto } from "@/lib/journal/diaryBookIncludePicker";
import { NO_INCLUDED_ENTRIES_IN_DIARY_BOOK_PERIOD_MESSAGE } from "@/lib/journal/diaryBookPeriod";

type PreviewResponse = {
  entryCount?: number;
  totalEntryCount?: number;
  canCreate?: boolean;
  message?: string;
  entries?: DiaryBookIncludePickerEntryDto[];
  error?: string;
  code?: string;
};

type CreateResponse = {
  book?: { id: string; title: string };
  error?: string;
  code?: string;
};

type CreatedBookSummary = {
  id: string;
  title: string;
};

type Props = {
  blockContinuedFeatures?: boolean;
  /** 森の本棚など、最初からフォームを開いた状態にする */
  defaultOpen?: boolean;
  /** 作成成功時（親が遷移・パネル閉じを担当する場合） */
  onCreated?: (book: { id: string; title: string }) => void;
};

const DEFAULT_NO_ENTRIES_MESSAGE =
  "この期間にはあしあとがありません。\n期間を変更するか、あしあとを残してからあしあとブックを作成してください。";

/** 作成ボタンが無効なときに表示する理由（優先順位順） */
export function diaryBookCreateDisabledReason(params: {
  title: string;
  startDate: string;
  endDate: string;
  periodChecked: boolean;
  canCreate: boolean;
  creating: boolean;
  /** 本に入れるあしあとにページはみ出しがある */
  hasOverflowIncluded?: boolean;
}): string | null {
  if (params.creating) return "作成中です";
  if (!params.title.trim()) return "あしあとブック名を入力してください";
  if (!params.startDate || !params.endDate) return "開始日と終了日を設定してください";
  if (!params.periodChecked) return "掲載するあしあとを確認してください";
  if (!params.canCreate) return "本に入れるあしあとがありません";
  if (params.hasOverflowIncluded) {
    return "はみ出しのあるあしあとを直してから作成してください";
  }
  return null;
}

export function DiaryBookCreateForm({
  blockContinuedFeatures = false,
  defaultOpen = false,
  onCreated,
}: Props) {
  const router = useRouter();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [open, setOpen] = useState(defaultOpen);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState(today);
  const [coverTheme, setCoverTheme] = useState<AshiatoCoverId>("cover_mori_standard");
  const [pageTemplate, setPageTemplate] = useState<AshiatoPageTemplateId>(
    DEFAULT_ASHIATO_PAGE_TEMPLATE_ID,
  );
  const [tagFilter, setTagFilter] = useState("");
  const [checking, setChecking] = useState(false);
  const [entryCount, setEntryCount] = useState<number | null>(null);
  const [canCreate, setCanCreate] = useState<boolean>(false);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);
  const [pickerEntries, setPickerEntries] = useState<DiaryBookIncludePickerEntryDto[] | null>(
    null,
  );
  const [periodChecked, setPeriodChecked] = useState(false);

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdBook, setCreatedBook] = useState<CreatedBookSummary | null>(null);

  const canPreview = Boolean(startDate && endDate);
  const hasOverflowIncluded = Boolean(
    pickerEntries?.some((e) => e.includeInBook && e.lengthFlag !== "ok"),
  );
  const canSubmit =
    Boolean(title.trim()) && canPreview && canCreate && !creating && !hasOverflowIncluded;
  const createDisabledReason = diaryBookCreateDisabledReason({
    title,
    startDate,
    endDate,
    periodChecked,
    canCreate,
    creating,
    hasOverflowIncluded,
  });

  async function checkPreview(overridePageTemplate?: AshiatoPageTemplateId) {
    if (!canPreview) return;
    const templateForPreview = overridePageTemplate ?? pageTemplate;
    setChecking(true);
    setError(null);
    setPreviewMessage(null);
    setPickerEntries(null);
    setPeriodChecked(false);
    try {
      const res = await fetch("/api/journal/diary-books/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          title: title.trim(),
          startDate,
          endDate,
          coverTheme,
          pageTemplate: templateForPreview,
          tag: tagFilter.trim() || undefined,
        }),
      });
      const data = (await res.json()) as PreviewResponse;
      if (!res.ok) {
        setEntryCount(null);
        setCanCreate(false);
        setError(data.error ?? "件数確認に失敗しました。");
        return;
      }
      const count = Number.isFinite(data.entryCount) ? Number(data.entryCount) : 0;
      const list = Array.isArray(data.entries) ? data.entries : [];
      const creatable = data.canCreate === true && count > 0;
      setEntryCount(count);
      setCanCreate(creatable);
      setPickerEntries(list.length > 0 ? list : null);
      setPeriodChecked(true);
      if (!creatable) {
        setPreviewMessage(data.message ?? DEFAULT_NO_ENTRIES_MESSAGE);
      } else {
        setPreviewMessage(null);
      }
    } catch {
      setEntryCount(null);
      setCanCreate(false);
      setError("件数確認に失敗しました。");
    } finally {
      setChecking(false);
    }
  }

  function handlePageTemplateChange(next: AshiatoPageTemplateId) {
    setPageTemplate(next);
    if (periodChecked) {
      void checkPreview(next);
    }
  }

  function resetCreateForm() {
    setTitle("");
    setStartDate("");
    setEndDate(today);
    setCoverTheme("cover_mori_standard");
    setPageTemplate(DEFAULT_ASHIATO_PAGE_TEMPLATE_ID);
    setTagFilter("");
    setEntryCount(null);
    setCanCreate(false);
    setPreviewMessage(null);
    setPickerEntries(null);
    setPeriodChecked(false);
    setError(null);
  }

  function scrollToCreatedBookInBookshelf(bookId: string) {
    const card = document.getElementById(`diary-book-${bookId}`);
    const list = document.getElementById("bookshelf-diary-books");
    (card ?? list)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function startAnotherBook() {
    setCreatedBook(null);
    resetCreateForm();
    setOpen(true);
  }

  async function createDiaryBook() {
    if (!canSubmit) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/journal/diary-books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          title: title.trim(),
          startDate,
          endDate,
          coverTheme,
          pageTemplate,
          tag: tagFilter.trim() || undefined,
        }),
      });
      const data = (await res.json()) as CreateResponse;
      if (!res.ok) {
        setError(data.error ?? "あしあとブックの作成に失敗しました。");
        return;
      }
      const createdId = data.book?.id?.trim();
      const createdTitle = data.book?.title?.trim() || title.trim();
      if (!createdId) {
        setError("あしあとブックの作成に失敗しました。");
        return;
      }
      setCreatedBook({ id: createdId, title: createdTitle });
      setOpen(true);
      onCreated?.({ id: createdId, title: createdTitle });
      router.refresh();
    } catch {
      setError("あしあとブックの作成に失敗しました。");
    } finally {
      setCreating(false);
    }
  }

  if (blockContinuedFeatures) {
    return (
      <section className="rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3.5 shadow-sm">
        <h2 className="text-base font-semibold text-stone-900">あしあとブックを作る</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-700">
          あしあとブックの新規作成は、はじめてのあしあとを残したあと、または森の定期便のご利用開始後にご利用いただけます。
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-emerald-200/70 bg-gradient-to-br from-[#faf8f5] via-emerald-50/50 to-emerald-50/70 px-4 py-3.5 shadow-sm">
      <h2 className="text-base font-semibold text-stone-900">あしあとブックを作る</h2>
      <p className="mt-1 text-sm leading-relaxed text-stone-600">
        あしあとをまとめて、1冊の本にします。
      </p>
      {createdBook ? (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/80 px-4 py-4">
          <p className="text-sm font-semibold text-emerald-950">あしあとブックを作成しました。</p>
          <p className="mt-2 text-sm leading-relaxed text-emerald-900/90">
            作成したあしあとブック「{createdBook.title}」を本棚に追加しました。
            下の一覧から「読む」または「製本版を注文する」を選べます。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => scrollToCreatedBookInBookshelf(createdBook.id)}
              className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900"
            >
              本棚を見る
            </button>
            <button
              type="button"
              onClick={startAnotherBook}
              className="rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-50"
            >
              もう1冊作る
            </button>
          </div>
        </div>
      ) : !open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-900"
        >
          本にする
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-3 text-xs text-stone-500 underline-offset-2 hover:text-stone-800 hover:underline"
        >
          閉じる
        </button>
      )}

      {open && !createdBook ? (
        <div className="mt-4 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-stone-700">あしあとブック名</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              placeholder="例: 娘の1歳の記録"
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </label>

          <div className="block text-sm">
            <span className="mb-2 block text-stone-700">表紙を選ぶ</span>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {ashiatoCoverOptions.map((opt) => {
                const selected = coverTheme === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setCoverTheme(opt.id)}
                    className={`rounded-lg border-2 p-1.5 text-left transition sm:p-2 ${
                      selected
                        ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200"
                        : "border-stone-200 bg-white hover:border-stone-300"
                    }`}
                  >
                    <div className="relative aspect-[724/1024] overflow-hidden rounded-md border border-stone-200 bg-stone-100">
                      <Image
                        src={diaryCoverImagePath(opt.id)}
                        alt={`${opt.label}の表紙`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 30vw, 140px"
                        unoptimized
                      />
                    </div>
                    <div className="mt-1.5 flex items-start justify-between gap-1">
                      <span className="text-[11px] font-medium leading-snug text-stone-900 sm:text-sm">
                        {opt.label}
                      </span>
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] sm:h-5 sm:w-5 sm:text-xs ${
                          selected
                            ? "bg-emerald-700 text-white"
                            : "border border-stone-300 text-stone-400"
                        }`}
                        aria-hidden
                      >
                        {selected ? "✓" : "○"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <AshiatoPageShapePicker value={pageTemplate} onChange={handlePageTemplateChange} />

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-stone-700">開始日</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPeriodChecked(false);
                  setPickerEntries(null);
                  setEntryCount(null);
                  setCanCreate(false);
                  setPreviewMessage(null);
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
                  setPeriodChecked(false);
                  setPickerEntries(null);
                  setEntryCount(null);
                  setCanCreate(false);
                  setPreviewMessage(null);
                }}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block text-stone-700">タグで絞り込む（任意）</span>
            <input
              type="text"
              value={tagFilter}
              onChange={(e) => {
                setTagFilter(e.target.value);
                setPeriodChecked(false);
                setPickerEntries(null);
                setEntryCount(null);
                setCanCreate(false);
                setPreviewMessage(null);
              }}
              placeholder={TAG_INPUT_PLACEHOLDER}
              autoComplete="off"
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm placeholder:text-stone-400"
            />
            <span className="mt-1 block text-xs text-stone-500">
              期間内のあしあとのうち、指定タグが付いたものだけを一覧に表示します。
            </span>
          </label>

          <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
            {entryCount == null ? (
              "この期間のあしあとは、確認後に表示されます。"
            ) : (
              <>
                この期間のあしあと:{" "}
                <span className="font-semibold text-stone-900">{entryCount}件</span>
              </>
            )}
          </div>

          {periodChecked && pickerEntries && pickerEntries.length > 0 ? (
            <DiaryBookIncludeInBookMonthList
              entries={pickerEntries}
              pageTemplate={pageTemplate}
              onSaved={({ includedCount, entries }) => {
                setPickerEntries(entries);
                setEntryCount(includedCount);
                const creatable = includedCount > 0;
                setCanCreate(creatable);
                setPreviewMessage(
                  creatable ? null : NO_INCLUDED_ENTRIES_IN_DIARY_BOOK_PERIOD_MESSAGE,
                );
              }}
            />
          ) : null}

          {hasOverflowIncluded ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-relaxed text-amber-950">
              本に入れるあしあとにページのはみ出しがあります。文字サイズや文章を直してから、あしあとブックを作成してください。
            </p>
          ) : null}

          {previewMessage ? (
            <p className="whitespace-pre-line rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {previewMessage}
            </p>
          ) : null}
          {error ? (
            <p className="whitespace-pre-line rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
              {error}
            </p>
          ) : null}
          <div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!canPreview || checking}
                onClick={() => void checkPreview()}
                className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-100 disabled:opacity-50"
              >
                {checking ? "確認中…" : "掲載するあしあとを確認"}
              </button>
              <button
                type="button"
                disabled={!canSubmit}
                onClick={() => void createDiaryBook()}
                className="rounded-lg bg-emerald-800 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-50"
              >
                {creating ? "作成中…" : "あしあとブックを作成"}
              </button>
            </div>
            {createDisabledReason ? (
              <p className="mt-2 text-sm font-medium text-red-600">{createDisabledReason}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
