"use client";

import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { formatDateTimeJa } from "@/lib/date/formatJa";

import { parseSafeBookshelfDiaryReturnTo } from "@/lib/journal/bookshelfReturnTo";
import {
  activityOptions,
  getActivityMeta,
  isDiaryDesignId,
  getMoodMeta,
  moodOptions,
  type ActivityId,
  type DiaryDesignId,
  type MoodId,
} from "@/lib/journal/meta";

type Entry = {
  id: string;
  content: string;
  createdAt: string;
  mood: MoodId;
  activity: ActivityId;
  companionType: string;
  designTheme?: DiaryDesignId;
  photoDataUrl: string | null;
  generatedComment: string | null;
  includeInBook: boolean;
};

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isValidDateInput(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const probe = new Date(y, m - 1, d);
  return (
    probe.getFullYear() === y &&
    probe.getMonth() === m - 1 &&
    probe.getDate() === d
  );
}

async function compressToSquareDataUrl(file: File, offsetPercent: number): Promise<string> {
  const imageBitmap = await createImageBitmap(file);
  const targetSize = 760;
  const primaryMime = "image/webp";
  const primaryQuality = 0.8;
  const fallbackMime = "image/jpeg";
  const fallbackQuality = 0.8;
  const offset = Math.max(0, Math.min(100, offsetPercent)) / 100;

  const canvas = document.createElement("canvas");
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("画像処理の初期化に失敗しました。");

  const sourceSide = Math.min(imageBitmap.width, imageBitmap.height);
  let sx = 0;
  let sy = 0;
  if (imageBitmap.width > imageBitmap.height) {
    sx = Math.round((imageBitmap.width - sourceSide) * offset);
  } else if (imageBitmap.height > imageBitmap.width) {
    sy = Math.round((imageBitmap.height - sourceSide) * offset);
  }
  ctx.drawImage(imageBitmap, sx, sy, sourceSide, sourceSide, 0, 0, targetSize, targetSize);
  imageBitmap.close();

  const primary = canvas.toDataURL(primaryMime, primaryQuality);
  // Safari 等で webp が使えない環境を考慮して jpeg にフォールバック
  if (primary.startsWith("data:image/webp")) return primary;
  return canvas.toDataURL(fallbackMime, fallbackQuality);
}

function JournalPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useFirebaseAuth();
  const editingId = searchParams.get("edit");
  const profileId = (searchParams.get("profile") ?? "").trim();
  const dateFromQuery = searchParams.get("date");
  const safeReturnToBookshelf = useMemo(
    () => parseSafeBookshelfDiaryReturnTo(searchParams.get("returnTo")),
    [searchParams],
  );
  const [content, setContent] = useState("");
  const [entryDate, setEntryDate] = useState(() => toDateInputValue(new Date()));
  const [mood, setMood] = useState<MoodId>("calm");
  const [activity, setActivity] = useState<ActivityId>("record_anyway");
  const [designTheme, setDesignTheme] = useState<DiaryDesignId>("simple");
  const [includeInBook, setIncludeInBook] = useState(true);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [photoDataUrl, setPhotoDataUrl] = useState<string>("");
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [cropOffset, setCropOffset] = useState(50);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [serverViewerEmail, setServerViewerEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const qs = new URLSearchParams();
      qs.set("_", String(Date.now()));
      if (profileId) qs.set("profileId", profileId);
      const res = await fetch(`/api/journal?${qs.toString()}`, {
        cache: "no-store",
        credentials: "same-origin",
      });
      const data = (await res.json()) as {
        entries?: Entry[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "日記の読み込みに失敗しました。");
        return;
      }
      setEntries(data.entries ?? []);
    } catch {
      setError("日記の読み込みに失敗しました。");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [profileId]);

  useEffect(() => {
    if (authLoading) return;

    const clientEmail = user?.email?.trim().toLowerCase() ?? "";
    if (!clientEmail) {
      setEntries([]);
      setServerViewerEmail(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        try {
          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: clientEmail }),
          });
          const sessionRes = await fetch("/api/auth/session", { cache: "no-store" });
          const sessionData = (await sessionRes.json()) as { email?: string | null };
          if (!cancelled) {
            setServerViewerEmail((sessionData.email ?? null) ? String(sessionData.email).toLowerCase() : null);
          }
        } catch {
          if (!cancelled) {
            setServerViewerEmail(null);
          }
        }

        if (cancelled) return;
        await loadEntries({ silent: true });
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.email, loadEntries]);

  useEffect(() => {
    const reload = () => {
      if (authLoading) return;
      const email = user?.email?.trim();
      if (!email) return;
      void loadEntries({ silent: true });
      router.refresh();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") reload();
    };
    window.addEventListener("focus", reload);
    window.addEventListener("pageshow", reload);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", reload);
      window.removeEventListener("pageshow", reload);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [authLoading, user?.email, loadEntries, router]);

  useEffect(() => {
    if (editingId) return;
    if (!dateFromQuery || !isValidDateInput(dateFromQuery)) {
      setEntryDate(toDateInputValue(new Date()));
      return;
    }
    setEntryDate(dateFromQuery);
  }, [editingId, dateFromQuery]);

  useEffect(() => {
    if (!editingId) return;
    setLoadingEdit(true);
    setError(null);
    void fetch(`/api/journal/${encodeURIComponent(editingId)}?_=${Date.now()}`, {
      cache: "no-store",
      credentials: "same-origin",
    })
      .then(async (res) => {
        const data = (await res.json()) as {
          entry?: Entry;
          error?: string;
        };
        if (!res.ok || !data.entry) {
          throw new Error(data.error ?? "編集対象の読み込みに失敗しました。");
        }
        setContent(data.entry.content ?? "");
        setMood(data.entry.mood ?? "calm");
        setActivity(data.entry.activity ?? "record_anyway");
        const design = data.entry.designTheme;
        setDesignTheme(design && isDiaryDesignId(design) ? design : "simple");
        setPhotoDataUrl(data.entry.photoDataUrl ?? "");
        setIncludeInBook(data.entry.includeInBook !== false);
        setEntryDate(
          toDateInputValue(
            new Date(data.entry.createdAt != null ? data.entry.createdAt : Date.now()),
          ),
        );
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "編集対象の読み込みに失敗しました。");
      })
      .finally(() => setLoadingEdit(false));
  }, [editingId]);

  useEffect(() => {
    if (!selectedPhotoFile) return;
    setProcessingPhoto(true);
    setError(null);
    void compressToSquareDataUrl(selectedPhotoFile, cropOffset)
      .then((result) => {
        setPhotoDataUrl(result);
      })
      .catch(() => {
        setError("写真の圧縮に失敗しました。別の画像でお試しください。");
      })
      .finally(() => {
        setProcessingPhoto(false);
      });
  }, [selectedPhotoFile, cropOffset]);

  async function saveEntry(options?: { redirectToOrders?: boolean; redirectToPreview?: boolean }) {
    setError(null);

    const text = content.trim();
    if (!text) {
      setError("本文を入力してください。");
      return;
    }
    if (!isValidDateInput(entryDate)) {
      setError("記録日を正しく入力してください。");
      return;
    }

    setSaving(true);
    try {
      const endpoint = editingId
        ? `/api/journal/${encodeURIComponent(editingId)}`
        : "/api/journal";
      const res = await fetch(endpoint, {
        method: editingId ? "PATCH" : "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text,
          mood,
          activity,
          companionType: "owl",
          designTheme,
          photoDataUrl,
          entryDate,
          includeInBook,
          profileId,
        }),
      });
      const data = (await res.json()) as { error?: string; entry?: { id?: string } };
      if (!res.ok) {
        setError(data.error ?? "保存に失敗しました。");
        return;
      }
      const savedId = data.entry?.id ? String(data.entry.id) : editingId;
      setContent("");
      setPhotoDataUrl("");
      setSelectedPhotoFile(null);
      setIncludeInBook(true);
      setEntryDate(toDateInputValue(new Date()));
      await loadEntries({ silent: true });
      if (options?.redirectToPreview && savedId) {
        router.push(
          `/journal/preview?entry=${encodeURIComponent(savedId)}&theme=${encodeURIComponent(designTheme)}&pv=3`,
        );
        return;
      }
      if (options?.redirectToOrders) {
        router.push("/orders");
        return;
      }
      if (editingId && safeReturnToBookshelf) {
        router.push(safeReturnToBookshelf);
        return;
      }
      if (editingId) {
        router.replace(profileId ? `/journal?profile=${encodeURIComponent(profileId)}` : "/journal");
      }
    } catch {
      setError("通信に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await saveEntry();
  }

  async function deleteEntry(id: string) {
    const ok = window.confirm("この記録を本当に削除しますか？");
    if (!ok) return;

    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/journal/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "削除に失敗しました。");
        return;
      }
      if (editingId === id) {
        setContent("");
        setPhotoDataUrl("");
        setSelectedPhotoFile(null);
        setMood("calm");
        setActivity("record_anyway");
        setDesignTheme("simple");
        setIncludeInBook(true);
        router.replace("/journal");
      }
      await loadEntries({ silent: true });
    } catch {
      setError("削除時の通信に失敗しました。");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">今日の記録</h1>
        <p className="mt-1 text-sm text-stone-600">
          今日感じたことや気づきを、短くメモして残しておけます。
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href="/orders" className="text-sm text-stone-600 underline-offset-2 hover:underline">
            ← マイページに戻る
          </Link>
          {editingId && safeReturnToBookshelf ? (
            <Link
              href={safeReturnToBookshelf}
              className="text-sm text-emerald-800 underline-offset-2 hover:underline"
            >
              ← 本の最終確認に戻る（保存しない）
            </Link>
          ) : null}
        </p>
        {!authLoading && user?.email ? (
          <p className="mt-2 text-xs text-stone-500">
            ログイン中: {user.email}
            {serverViewerEmail && serverViewerEmail !== user.email.toLowerCase()
              ? `（サーバー認識: ${serverViewerEmail}）`
              : ""}
          </p>
        ) : null}
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        {editingId ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {loadingEdit ? "記録を読み込み中…" : "編集モードです。内容を更新できます。"}
          </div>
        ) : null}
        <label className="block text-sm font-medium text-stone-700" htmlFor="journal-mood">
          今日の気分
        </label>
        <select
          id="journal-mood"
          value={mood}
          onChange={(e) => setMood(e.target.value as MoodId)}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none ring-stone-400 focus:ring-2"
        >
          {moodOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.emoji} {option.label}
            </option>
          ))}
        </select>
        <label className="block text-sm font-medium text-stone-700" htmlFor="journal-activity">
          今日はどんな一日でしたか？
        </label>
        <select
          id="journal-activity"
          value={activity}
          onChange={(e) => setActivity(e.target.value as ActivityId)}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none ring-stone-400 focus:ring-2"
        >
          {activityOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <label className="block text-sm font-medium text-stone-700" htmlFor="journal-content">
          記録する内容
        </label>
        <label className="block text-sm font-medium text-stone-700" htmlFor="journal-entry-date">
          記録日
        </label>
        <input
          id="journal-entry-date"
          type="date"
          value={entryDate}
          onChange={(e) => setEntryDate(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none ring-stone-400 focus:ring-2"
        />
        <label className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-800">
          <input
            type="checkbox"
            checked={includeInBook}
            onChange={(e) => setIncludeInBook(e.target.checked)}
            className="h-4 w-4 rounded border-stone-300 text-emerald-700 focus:ring-emerald-600"
          />
          このページを本に入れる
        </label>
        <textarea
          id="journal-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={2000}
          rows={6}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none ring-stone-400 focus:ring-2"
          placeholder="例）今日は数字のメッセージを読んで、焦らなくていいと思えた。"
        />
        <label className="block text-sm font-medium text-stone-700" htmlFor="journal-photo">
          写真（任意）
        </label>
        <input
          id="journal-photo"
          type="file"
          accept="image/*"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-700 file:mr-3 file:rounded file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-sm file:text-stone-700"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) {
              setPhotoDataUrl("");
              setSelectedPhotoFile(null);
              return;
            }
            setCropOffset(50);
            setSelectedPhotoFile(file);
          }}
        />
        {selectedPhotoFile ? (
          <label className="block">
            <span className="text-xs text-stone-600">写真の位置調整（{cropOffset}%）</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={cropOffset}
              onChange={(e) => setCropOffset(Number(e.target.value))}
              className="mt-1 w-full"
            />
          </label>
        ) : null}
        {processingPhoto ? (
          <p className="text-xs text-stone-500">写真を最適化しています…</p>
        ) : null}
        {photoDataUrl ? (
          <img
            src={photoDataUrl}
            alt="選択した写真プレビュー"
            className="aspect-square w-full rounded-lg border border-stone-200 bg-[#f7f4ee] object-contain"
          />
        ) : null}
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-xs text-stone-500">{content.length}/2000</p>
          <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={saving || processingPhoto}
              className="whitespace-nowrap rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700 disabled:opacity-60"
            >
              {saving ? "保存中…" : editingId ? "更新する" : "保存する"}
            </button>
            <button
              type="button"
              disabled={saving || processingPhoto}
              onClick={() => void saveEntry({ redirectToPreview: true })}
              className="whitespace-nowrap rounded-lg border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-900 transition hover:bg-violet-100 disabled:opacity-60"
            >
              保存してプレビュー
            </button>
            <button
              type="button"
              disabled={saving || processingPhoto}
              onClick={() => void saveEntry({ redirectToOrders: true })}
              className="whitespace-nowrap rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:opacity-60"
            >
              保存してマイページへ
            </button>
            <button
              type="button"
              disabled={saving || processingPhoto}
              onClick={() => {
                setContent("");
                setPhotoDataUrl("");
                setSelectedPhotoFile(null);
                setMood("calm");
                setActivity("record_anyway");
                setDesignTheme("simple");
                setIncludeInBook(true);
                setEntryDate(toDateInputValue(new Date()));
                setError(null);
              }}
              className="whitespace-nowrap rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:opacity-60"
            >
              入力をクリア
            </button>
            {editingId ? (
              <button
                type="button"
                disabled={saving || processingPhoto}
                onClick={() => {
                  setContent("");
                  setPhotoDataUrl("");
                  setSelectedPhotoFile(null);
                  setMood("calm");
                  setActivity("record_anyway");
                  setDesignTheme("simple");
                  setIncludeInBook(true);
                  setEntryDate(toDateInputValue(new Date()));
                  router.replace("/journal");
                }}
                className="whitespace-nowrap rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:opacity-60"
              >
                編集をやめる
              </button>
            ) : null}
          </div>
        </div>
      </form>

      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-stone-900">これまでの記録</h2>
        {loading ? (
          <p className="text-sm text-stone-500">読み込み中…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-stone-500">まだ記録はありません。</p>
        ) : (
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li key={entry.id} className="rounded-xl border border-stone-200 bg-white p-4 text-sm shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-stone-700">
                    {getMoodMeta(entry.mood).emoji} {getMoodMeta(entry.mood).label}
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="text-xs text-stone-600 underline underline-offset-2 hover:text-stone-900"
                      onClick={() => {
                        router.push(`/journal?edit=${encodeURIComponent(entry.id)}`);
                      }}
                    >
                      編集する
                    </button>
                    <button
                      type="button"
                      className="text-xs text-violet-700 underline underline-offset-2 hover:text-violet-900"
                      onClick={() => {
                        const themeId = entry.designTheme;
                        const previewTheme =
                          themeId && isDiaryDesignId(themeId) ? themeId : designTheme;
                        router.push(
                          `/journal/preview?entry=${encodeURIComponent(entry.id)}&theme=${encodeURIComponent(previewTheme)}&pv=3`,
                        );
                      }}
                    >
                      プレビュー
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === entry.id}
                      className="text-xs text-red-600 underline underline-offset-2 hover:text-red-700 disabled:opacity-50"
                      onClick={() => void deleteEntry(entry.id)}
                    >
                      {deletingId === entry.id ? "削除中…" : "削除"}
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  今日やったこと: {getActivityMeta(entry.activity).label}
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  デザイン: {entry.designTheme === "simple" ? "シンプル系" : "かわいい系（スタンダード）"}
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  本への掲載: {entry.includeInBook ? "入れる" : "入れない"}
                </p>
                {entry.photoDataUrl ? (
                  <img
                    src={entry.photoDataUrl}
                    alt="日記に添付した写真"
                    className="mt-2 aspect-square w-full rounded-lg border border-stone-200 bg-[#f7f4ee] object-contain"
                  />
                ) : null}
                <p className="whitespace-pre-wrap leading-7 text-stone-800">{entry.content}</p>
                {entry.generatedComment ? (
                  <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2">
                    <p className="text-xs font-medium text-emerald-900">フクロウ先生の読み解き</p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-emerald-900/90">
                      {entry.generatedComment}
                    </p>
                  </div>
                ) : null}
                <p className="mt-2 text-xs text-stone-500">
                  {formatDateTimeJa(entry.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function JournalPage() {
  return (
    <Suspense fallback={<p className="text-sm text-stone-500">読み込み中…</p>}>
      <JournalPageContent />
    </Suspense>
  );
}
