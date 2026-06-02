"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  diaryCoverImagePath,
  diaryCoverStyleOptions,
  type DiaryCoverStyleId,
} from "@/lib/journal/coverAssets";

type PreviewResponse = {
  entryCount?: number;
  canCreate?: boolean;
  message?: string;
  error?: string;
  code?: string;
};

type CreateResponse = {
  error?: string;
  code?: string;
};

const DEFAULT_NO_ENTRIES_MESSAGE =
  "この期間には日記がありません。\n期間を変更するか、日記を書いてから日記ブックを作成してください。";

export function DiaryBookCreateForm() {
  const router = useRouter();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState(today);
  const [coverTheme, setCoverTheme] = useState<DiaryCoverStyleId>("casual");

  const [checking, setChecking] = useState(false);
  const [entryCount, setEntryCount] = useState<number | null>(null);
  const [canCreate, setCanCreate] = useState<boolean>(false);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canPreview = Boolean(startDate && endDate);
  const canSubmit = Boolean(title.trim()) && canPreview && canCreate && !creating;
  const showCreateHint = !canSubmit && !creating && entryCount == null;

  async function checkPreview() {
    if (!canPreview) return;
    setChecking(true);
    setError(null);
    setNotice(null);
    setPreviewMessage(null);
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
      const creatable = data.canCreate === true && count > 0;
      setEntryCount(count);
      setCanCreate(creatable);
      if (!creatable) {
        setPreviewMessage(data.message ?? DEFAULT_NO_ENTRIES_MESSAGE);
      }
    } catch {
      setEntryCount(null);
      setCanCreate(false);
      setError("件数確認に失敗しました。");
    } finally {
      setChecking(false);
    }
  }

  async function createDiaryBook() {
    if (!canSubmit) return;
    setCreating(true);
    setError(null);
    setNotice(null);
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
        }),
      });
      const data = (await res.json()) as CreateResponse;
      if (!res.ok) {
        setError(data.error ?? "日記ブックの作成に失敗しました。");
        return;
      }
      setNotice("日記ブックを作成しました。本棚を更新します。");
      setTitle("");
      setStartDate("");
      setEndDate(today);
      setCoverTheme("casual");
      setEntryCount(null);
      setCanCreate(false);
      setPreviewMessage(null);
      router.refresh();
    } catch {
      setError("日記ブックの作成に失敗しました。");
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="rounded-xl border border-emerald-200/70 bg-gradient-to-br from-[#faf8f5] via-emerald-50/50 to-emerald-50/70 px-4 py-3.5 shadow-sm">
      <h2 className="text-base font-semibold text-stone-900">日記ブックを作る</h2>
      <p className="mt-1 text-sm leading-relaxed text-stone-600">
        日記をまとめて、1冊の本にします。
      </p>
      {!open ? (
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

      {open ? (
        <div className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-stone-700">日記ブック名</span>
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
            <div className="grid grid-cols-2 gap-3">
              {diaryCoverStyleOptions.map((opt) => {
                const selected = coverTheme === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setCoverTheme(opt.id)}
                    className={`rounded-lg border-2 p-2 text-left transition ${
                      selected
                        ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200"
                        : "border-stone-200 bg-white hover:border-stone-300"
                    }`}
                  >
                    <div className="relative aspect-[724/1024] overflow-hidden rounded-md border border-stone-200 bg-stone-100">
                      <Image
                        src={diaryCoverImagePath(opt.id, "owl")}
                        alt={`${opt.label}の表紙`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 40vw, 160px"
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-stone-900">{opt.label}</span>
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
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

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-stone-700">開始日</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-stone-700">終了日</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
            {entryCount == null ? (
              "この期間の日記は、確認後に表示されます。"
            ) : (
              <>
                この期間の日記:{" "}
                <span className="font-semibold text-stone-900">{entryCount}件</span>
              </>
            )}
          </div>

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
          {notice ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              {notice}
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
                {checking ? "確認中…" : "この期間の日記を確認"}
              </button>
              <button
                type="button"
                disabled={!canSubmit}
                onClick={() => void createDiaryBook()}
                className="rounded-lg bg-emerald-800 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-50"
              >
                {creating ? "作成中…" : "日記ブックを作成"}
              </button>
            </div>
            {showCreateHint ? (
              <p className="mt-2 text-xs text-red-600">
                日記ブック名・開始日・終了日を入力し、「この期間の日記を確認」を押してください。
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
