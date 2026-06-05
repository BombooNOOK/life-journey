"use client";

import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { formatDateTimeJa } from "@/lib/date/formatJa";

import { JournalCompanionPicker } from "@/components/journal/JournalCompanionPicker";
import { FieldLabelWithHelp } from "@/components/ui/InlineHelpButton";
import {
  JOURNAL_CONTENT_HELP,
  JOURNAL_FONT_SIZE_HELP,
} from "@/lib/journal/journalInputHelpCopy";
import {
  formatJournalRecordPageTitle,
  journalBodyInputHeading,
} from "@/lib/journal/journalRecordDateDisplay";
import { JournalWritingComposer } from "@/components/journal/JournalWritingComposer";
import { JournalContentLengthAlerts } from "@/components/journal/JournalContentLengthAlerts";
import { parseSafeJournalReturnTo } from "@/lib/journal/bookshelfReturnTo";
import {
  CONTENT_FONT_MODE_LABELS_JA,
  CONTENT_FONT_MODES,
  DEFAULT_CONTENT_FONT_MODE,
  type ContentFontMode,
  JOURNAL_CONTENT_SOFT_MAX_BY_MODE,
  normalizeContentFontMode,
} from "@/lib/journal/contentFontMode";
import {
  countBodyLayoutLines,
  getDiaryBodyLineLimit,
  isDiaryBodyOverLineLimit,
} from "@/lib/journal/diaryPreviewBodyLineLimits";
import type { JournalNumerologyDebug } from "@/lib/journal/journalNumerologyDebug";
import {
  activityOptions,
  getActivityMeta,
  getCompanionLabel,
  getCompanionReadingHeading,
  getMoodMeta,
  moodOptions,
  PHASE1_COMPANION_TYPE,
  type ActivityId,
  type DiaryDesignId,
  type MoodId,
} from "@/lib/journal/meta";
import { JOURNAL_OWL_COMMENT_KANTEI_REQUIRED_MESSAGE } from "@/lib/journal/kanteiCommentCopy";

type Entry = {
  id: string;
  content: string;
  createdAt: string;
  mood: MoodId;
  activity: ActivityId;
  companionType: string;
  designTheme?: DiaryDesignId;
  contentFontMode?: string;
  /** 一覧 API では hasPhoto のみ。編集 GET では photoSrc（Blob/legacy 共通） */
  photoDataUrl?: string | null;
  photoSrc?: string | null;
  hasPhoto?: boolean;
  generatedComment: string | null;
  includeInBook: boolean;
  /** 単件 GET などで付与。編集時に URL の profile と揃えるために使う */
  profileId?: string;
  /** GET `?numerologyDebug=1` のときのみ */
  numerologyDebug?: JournalNumerologyDebug;
};

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toDateInputValueUtc(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
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

/** 日記写真はテンプレ上おおよそ5cm角の製本表示を想定し、720pxで十分な解像度を確保する */
async function compressToSquareDataUrl(file: File, offsetPercent: number): Promise<string> {
  const imageBitmap = await createImageBitmap(file);
  const targetSize = 720;
  const primaryMime = "image/webp";
  const primaryQuality = 0.72;
  const fallbackMime = "image/jpeg";
  const fallbackQuality = 0.72;
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
  const showNumerologyDebug = searchParams.get("numerologyDebug") === "1";
  const showSyncDebug = searchParams.get("syncDebug") === "1";
  const showAuthDebug =
    showNumerologyDebug ||
    showSyncDebug ||
    process.env.NODE_ENV === "development";
  const safeReturnTo = useMemo(
    () => parseSafeJournalReturnTo(searchParams.get("returnTo")),
    [searchParams],
  );
  const returnToIsCalendar = safeReturnTo?.startsWith("/orders/calendar") ?? false;
  const [content, setContent] = useState("");
  const [entryDate, setEntryDate] = useState(() => toDateInputValue(new Date()));
  const [mood, setMood] = useState<MoodId>("calm");
  const [activity, setActivity] = useState<ActivityId>("record_anyway");
  const designTheme: DiaryDesignId = "simple_plain";
  const [contentFontMode, setContentFontMode] = useState<ContentFontMode>(DEFAULT_CONTENT_FONT_MODE);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [photoDataUrl, setPhotoDataUrl] = useState<string>("");
  const [existingPhotoSrc, setExistingPhotoSrc] = useState<string>("");
  const [photoDirty, setPhotoDirty] = useState(false);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [cropOffset, setCropOffset] = useState(50);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [serverViewerEmail, setServerViewerEmail] = useState<string | null>(null);
  const [profilesSnapshot, setProfilesSnapshot] = useState<{
    profiles: Array<{ id: string; nickname: string }>;
    activeProfileId: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [numerologyDebug, setNumerologyDebug] = useState<JournalNumerologyDebug | null>(null);
  const [owlRegenLoading, setOwlRegenLoading] = useState(false);
  const [navigatingToPreview, setNavigatingToPreview] = useState(false);
  const [kanteiOrderExists, setKanteiOrderExists] = useState<boolean | undefined>(undefined);

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
        kanteiOrderExists?: boolean;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "日記の読み込みに失敗しました。");
        return;
      }
      setKanteiOrderExists(data.kanteiOrderExists);
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
    if (authLoading || !user?.email?.trim()) {
      setProfilesSnapshot(null);
      return;
    }
    let cancelled = false;
    void fetch("/api/profiles", { credentials: "same-origin", cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json()) as {
          profiles?: Array<{ id: string; nickname: string }>;
          activeProfileId?: string;
        };
        if (!res.ok || cancelled) return;
        setProfilesSnapshot({
          profiles: data.profiles ?? [],
          activeProfileId: String(data.activeProfileId ?? ""),
        });
      })
      .catch(() => {
        if (!cancelled) setProfilesSnapshot(null);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.email]);

  useEffect(() => {
    if (editingId) return;
    if (!dateFromQuery || !isValidDateInput(dateFromQuery)) {
      setEntryDate(toDateInputValue(new Date()));
      return;
    }
    setEntryDate(dateFromQuery);
  }, [editingId, dateFromQuery]);

  useEffect(() => {
    if (!editingId) {
      setNumerologyDebug(null);
      return;
    }
    setLoadingEdit(true);
    setError(null);
    const qs = new URLSearchParams();
    qs.set("_", String(Date.now()));
    if (showNumerologyDebug) qs.set("numerologyDebug", "1");
    void fetch(`/api/journal/${encodeURIComponent(editingId)}?${qs.toString()}`, {
      cache: "no-store",
      credentials: "same-origin",
    })
      .then(async (res) => {
        const data = (await res.json()) as {
          entry?: Entry;
          kanteiOrderExists?: boolean;
          error?: string;
        };
        if (!res.ok || !data.entry) {
          throw new Error(data.error ?? "編集対象の読み込みに失敗しました。");
        }
        setKanteiOrderExists(data.kanteiOrderExists);
        setContent(data.entry.content ?? "");
        setMood(data.entry.mood ?? "calm");
        setActivity(data.entry.activity ?? "record_anyway");
        setContentFontMode(normalizeContentFontMode(data.entry.contentFontMode));
        setPhotoDataUrl(data.entry.photoDataUrl ?? "");
        setExistingPhotoSrc(
          data.entry.photoSrc?.trim() ||
            (data.entry.hasPhoto ? `/api/journal/entries/${encodeURIComponent(editingId)}/photo` : ""),
        );
        setPhotoDirty(false);
        setSelectedPhotoFile(null);
        setEntryDate(
          toDateInputValueUtc(
            new Date(data.entry.createdAt != null ? data.entry.createdAt : Date.now()),
          ),
        );
        setNumerologyDebug(data.entry.numerologyDebug ?? null);
        const rowPid =
          typeof data.entry.profileId === "string" ? data.entry.profileId.trim() : "";
        if (rowPid && searchParams.get("profile") !== rowPid) {
          const next = new URLSearchParams(searchParams.toString());
          next.set("profile", rowPid);
          next.set("edit", editingId);
          router.replace(`/journal?${next.toString()}`);
        }
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "編集対象の読み込みに失敗しました。");
      })
      .finally(() => {
        setLoadingEdit(false);
      });
  }, [editingId, router, searchParams, showNumerologyDebug]);

  useEffect(() => {
    if (!selectedPhotoFile) return;
    setProcessingPhoto(true);
    setError(null);
    void compressToSquareDataUrl(selectedPhotoFile, cropOffset)
      .then((result) => {
        setPhotoDataUrl(result);
        setPhotoDirty(true);
        setExistingPhotoSrc("");
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
      const photoPayload = (() => {
        if (photoDirty) {
          if (photoDataUrl.trim()) return { photoDataUrl: photoDataUrl.trim() };
          return { photoRemoved: true };
        }
        if (editingId) return { photoUnchanged: true };
        return {};
      })();

      const res = await fetch(endpoint, {
        method: editingId ? "PATCH" : "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text,
          mood,
          activity,
          companionType: PHASE1_COMPANION_TYPE,
          designTheme,
          contentFontMode,
          ...photoPayload,
          entryDate,
          profileId,
        }),
      });
      const data = (await res.json()) as { error?: string; entry?: { id?: string } };
      if (!res.ok) {
        setError(data.error ?? "保存に失敗しました。");
        return;
      }
      const savedId = data.entry?.id ? String(data.entry.id) : editingId;
      if (options?.redirectToPreview && savedId) {
        setNavigatingToPreview(true);
        const previewQs = new URLSearchParams({
          entry: savedId,
          theme: designTheme,
          pv: "3",
        });
        if (safeReturnTo) previewQs.set("returnTo", safeReturnTo);
        router.push(`/journal/preview?${previewQs.toString()}`);
        return;
      }
      setContent("");
      setPhotoDataUrl("");
      setExistingPhotoSrc("");
      setPhotoDirty(false);
      setSelectedPhotoFile(null);
      setContentFontMode(DEFAULT_CONTENT_FONT_MODE);
      setEntryDate(toDateInputValue(new Date()));
      await loadEntries({ silent: true });
      if (options?.redirectToOrders) {
        router.push("/orders");
        return;
      }
      if (safeReturnTo) {
        router.push(safeReturnTo);
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

  async function regenerateOwlCommentOnce() {
    if (!editingId) return;
    const text = content.trim();
    if (!text) {
      setError("本文を入力してください。");
      return;
    }
    if (!isValidDateInput(entryDate)) {
      setError("記録日を正しく入力してください。");
      return;
    }

    setOwlRegenLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/journal/${encodeURIComponent(editingId)}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text,
          mood,
          activity,
          companionType: PHASE1_COMPANION_TYPE,
          designTheme,
          contentFontMode,
          photoUnchanged: true,
          entryDate,
          profileId,
          regenerateOwlComment: true,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "読み解きの再生成に失敗しました。");
        return;
      }
      await loadEntries({ silent: true });
      const qs = new URLSearchParams();
      qs.set("_", String(Date.now()));
      if (showNumerologyDebug) qs.set("numerologyDebug", "1");
      const getRes = await fetch(`/api/journal/${encodeURIComponent(editingId)}?${qs.toString()}`, {
        cache: "no-store",
        credentials: "same-origin",
      });
      const getData = (await getRes.json()) as { entry?: Entry };
      if (getRes.ok && getData.entry?.numerologyDebug) {
        setNumerologyDebug(getData.entry.numerologyDebug);
      }
    } catch {
      setError("通信に失敗しました。");
    } finally {
      setOwlRegenLoading(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await saveEntry();
  }

  async function deleteEntry(id: string) {
    const entryId = id.trim();
    if (!entryId) return;

    const ok = window.confirm("この記録を本当に削除しますか？");
    if (!ok) return;

    const editingThis = editingId === entryId;

    setDeletingId(entryId);
    setError(null);

    // 先頭＝最新記事は ?edit= と一致しやすい。URL とフォームを先に外して編集再取得との競合を防ぐ。
    if (editingThis) {
      const href = profileId
        ? `/journal?profile=${encodeURIComponent(profileId)}`
        : "/journal";
      router.replace(href);
      setContent("");
      setPhotoDataUrl("");
      setSelectedPhotoFile(null);
      setMood("calm");
      setActivity("record_anyway");
      setContentFontMode(DEFAULT_CONTENT_FONT_MODE);
      setEntryDate(toDateInputValue(new Date()));
      setNumerologyDebug(null);
    }

    try {
      const res = await fetch(`/api/journal/${encodeURIComponent(entryId)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "削除に失敗しました。");
        return;
      }
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      await loadEntries({ silent: true });
    } catch {
      setError("削除時の通信に失敗しました。");
    } finally {
      setDeletingId(null);
    }
  }

  const effectiveProfileIdForLabel =
    profileId.trim() || (profilesSnapshot?.activeProfileId ?? "").trim() || "";
  const diaryTargetLabel =
    profilesSnapshot && effectiveProfileIdForLabel
      ? profilesSnapshot.profiles.find((p) => p.id === effectiveProfileIdForLabel)?.nickname ??
        "メイン"
      : null;

  const trimmedContent = content.trim();
  const charCount = trimmedContent.length;
  const charMax = JOURNAL_CONTENT_SOFT_MAX_BY_MODE[contentFontMode];
  const { maxLines: bodyMaxLines } = getDiaryBodyLineLimit(contentFontMode);
  const bodyLineCount = useMemo(
    () => countBodyLayoutLines(trimmedContent, contentFontMode),
    [trimmedContent, contentFontMode],
  );
  const bodyOverflows = useMemo(
    () => isDiaryBodyOverLineLimit(trimmedContent, contentFontMode),
    [trimmedContent, contentFontMode],
  );
  const commentOverflows = false;

  const recordPageTitle = formatJournalRecordPageTitle(entryDate);
  const bodyInputHeading = journalBodyInputHeading(entryDate);

  return (
    <div className="relative space-y-3">
      {navigatingToPreview ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#faf8f5]/90 backdrop-blur-[2px]"
          aria-live="polite"
          aria-busy="true"
        >
          <p className="rounded-xl border border-stone-200 bg-white px-5 py-4 text-sm text-stone-700 shadow-sm">
            プレビューを準備しています…
          </p>
        </div>
      ) : null}
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold leading-tight text-stone-900 sm:text-2xl">
            {recordPageTitle}
          </h1>
          {diaryTargetLabel !== null ? (
            <span
              className="rounded-full border border-violet-200/90 bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-900"
              title="いま書いている日記の対象"
            >
              {diaryTargetLabel}
            </span>
          ) : !authLoading && user?.email ? (
            <span className="text-[11px] text-stone-400">読み込み中…</span>
          ) : null}
        </div>
        <p className="text-xs leading-relaxed text-stone-500">
          こんな日だった。こんなことを思った。
          <br />
          そのままの言葉で残してみましょう。
        </p>
        {showAuthDebug && user?.email ? (
          <p className="text-[10px] leading-snug text-stone-400">
            ログイン: {user.email}
            {serverViewerEmail && serverViewerEmail !== user.email.toLowerCase()
              ? `（サーバー: ${serverViewerEmail}）`
              : ""}
          </p>
        ) : null}
        <p className="flex flex-wrap items-center gap-x-3 text-[11px] text-stone-400">
          <Link href="/orders" className="underline-offset-2 hover:text-stone-600 hover:underline">
            マイページ
          </Link>
          {safeReturnTo ? (
            <Link
              href={safeReturnTo}
              className="text-emerald-800 underline-offset-2 hover:underline"
            >
              {returnToIsCalendar ? "日記ホームへ" : "本の確認へ"}
            </Link>
          ) : null}
        </p>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        {editingId ? (
          <div className="flex flex-col gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-amber-900">
              {loadingEdit ? "記録を読み込み中…" : "編集モードです。内容を更新できます。"}
            </p>
            {!loadingEdit ? (
              <button
                type="button"
                disabled={saving || processingPhoto || deletingId === editingId}
                onClick={() => void deleteEntry(editingId)}
                className="shrink-0 self-start text-xs font-medium text-red-700 underline underline-offset-2 hover:text-red-800 disabled:opacity-50 sm:self-center"
              >
                {deletingId === editingId ? "削除中…" : "この日記を削除する"}
              </button>
            ) : null}
          </div>
        ) : null}

        <JournalWritingComposer
          label={
            <FieldLabelWithHelp
              as="label"
              htmlFor="journal-content"
              label={bodyInputHeading}
              help={JOURNAL_CONTENT_HELP}
              helpAriaLabel={`${bodyInputHeading}の説明`}
              labelClassName="text-base font-semibold text-stone-800"
            />
          }
          recordPageTitle={recordPageTitle}
          bodyInputHeading={bodyInputHeading}
          content={content}
          onContentChange={setContent}
          onContentFontModeChange={setContentFontMode}
          disabled={saving || loadingEdit || processingPhoto}
          placeholder="例）今日は少し疲れたけれど、帰り道の空がきれいだった。"
          contentFontMode={contentFontMode}
          charCount={charCount}
          charMax={charMax}
          bodyLineCount={bodyLineCount}
          bodyMaxLines={bodyMaxLines}
          bodyOverflows={bodyOverflows}
          commentOverflows={commentOverflows}
        />

        <fieldset className="hidden rounded-lg border border-stone-200/80 bg-stone-50/60 px-3 py-2.5 sm:block">
          <legend className="sr-only">文字サイズ</legend>
          <div className="px-1">
            <FieldLabelWithHelp
              label="文字サイズ"
              help={JOURNAL_FONT_SIZE_HELP}
              labelClassName="text-sm font-medium text-stone-800"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {CONTENT_FONT_MODES.map((mode) => (
              <label
                key={mode}
                className={[
                  "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                  contentFontMode === mode
                    ? "border-emerald-600 bg-emerald-50 text-emerald-950"
                    : "border-stone-200 bg-white text-stone-800 hover:bg-stone-50",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="journal-content-font-mode"
                  value={mode}
                  checked={contentFontMode === mode}
                  onChange={() => setContentFontMode(mode)}
                  className="h-4 w-4 border-stone-300 text-emerald-700 focus:ring-emerald-600"
                />
                {CONTENT_FONT_MODE_LABELS_JA[mode]}
              </label>
            ))}
          </div>
        </fieldset>

        <JournalContentLengthAlerts
          contentFontMode={contentFontMode}
          contentLength={charCount}
          bodyOverflows={bodyOverflows}
          commentOverflows={commentOverflows}
        />

        <div className="space-y-2 rounded-lg border border-dashed border-stone-200/90 bg-[#faf8f5]/50 px-3 py-3">
          <label className="block text-sm font-medium text-stone-700" htmlFor="journal-photo">
            この日の写真（任意）
          </label>
          <input
            id="journal-photo"
            type="file"
            accept="image/*"
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 file:mr-3 file:rounded file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-sm file:text-stone-700"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) {
                setPhotoDataUrl("");
                setExistingPhotoSrc("");
                setPhotoDirty(true);
                setSelectedPhotoFile(null);
                return;
              }
              setCropOffset(50);
              setPhotoDirty(true);
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
          {photoDataUrl || existingPhotoSrc ? (
            <img
              src={photoDataUrl || existingPhotoSrc}
              alt="選択した写真プレビュー"
              className="aspect-square w-full max-w-xs rounded-lg border border-stone-200 bg-[#f7f4ee] object-contain"
            />
          ) : null}
        </div>

        <div className="space-y-3 border-t border-stone-100 pt-3">
          <JournalCompanionPicker disabled={saving || loadingEdit || processingPhoto} />

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
        {editingId && !showNumerologyDebug ? (
          <p className="text-[11px] leading-relaxed text-stone-500">
            記録日まわりの数値（パーソナルデイ・暦など）を画面で確認するときは、URL に{" "}
            <code className="rounded bg-stone-100 px-1 py-0.5 text-[10px] text-stone-800">
              numerologyDebug=1
            </code>{" "}
            を付けて再読み込みしてください。
          </p>
        ) : null}
        {numerologyDebug ? (
          <details className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-800">
            <summary className="cursor-pointer select-none font-medium text-stone-700">
              数値の確認（サポート用）
            </summary>
            <p className="mt-2 text-[11px] leading-relaxed text-stone-500">
              フォームで選んだ記録日は、UTC のその暦日 12:00 として保存されます。数秘の計算はその UTC 暦日（年・月・日）だけを使うため、サーバーや端末のタイムゾーン設定に依存しません。iPhone と Mac で同じ記録を開いても API の結果は同じです。
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-stone-600">
              補足文ではパーソナルデイ（pd）と暦の桁（monthDigit / dayDigit）を別プレースホルダで埋めています。暦の日を桁おろした数字がパーソナルデイと同じときだけ、日付重なりの補足が選ばれます。月だけ重なるときは「暦の月を桁おろした数字も…」の文です。
            </p>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 tabular-nums">
              <dt className="text-stone-500">記録日（暦）</dt>
              <dd>
                {numerologyDebug.calendarYear}年{numerologyDebug.calendarMonth}月
                {numerologyDebug.calendarDay}日
              </dd>
              <dt className="text-stone-500">UTC インスタント</dt>
              <dd className="break-all">{numerologyDebug.referenceInstantIsoUtc}</dd>
              <dt className="text-stone-500">生まれ（月・日）</dt>
              <dd>
                {numerologyDebug.birthMonth ?? "—"}月{numerologyDebug.birthDay ?? "—"}日（注文プロフィール）
              </dd>
              <dt className="text-stone-500">パーソナルイヤー</dt>
              <dd>{numerologyDebug.personalYear}</dd>
              <dt className="text-stone-500">パーソナルマンス</dt>
              <dd>{numerologyDebug.personalMonth}</dd>
              <dt className="text-stone-500">パーソナルデイ</dt>
              <dd>{numerologyDebug.personalDay}</dd>
              <dt className="col-span-2 mt-1 font-medium text-stone-600">
                読み解き生成へ渡す値（fromJournal → generateDiaryReading）
              </dt>
              <dt className="text-stone-500">暦の月（1–12）</dt>
              <dd>{numerologyDebug.owlReadingInput.calendarMonth1To12}</dd>
              <dt className="text-stone-500">暦の日（1–31）</dt>
              <dd>{numerologyDebug.owlReadingInput.calendarDay1To31}</dd>
              <dt className="text-stone-500">accentMonthDigit</dt>
              <dd>{numerologyDebug.owlReadingInput.accentMonthDigit}</dd>
              <dt className="text-stone-500">accentDayDigit</dt>
              <dd>{numerologyDebug.owlReadingInput.accentDayDigit}</dd>
              <dt className="text-stone-500">本棚用 diaryNumbers</dt>
              <dd>
                PY {numerologyDebug.diaryNumbers.year} / PM {numerologyDebug.diaryNumbers.month} / PD{" "}
                {numerologyDebug.diaryNumbers.today}
              </dd>
            </dl>
            <div className="mt-3 border-t border-stone-200 pt-2">
              <p className="mb-2 text-[11px] leading-relaxed text-stone-600">
                DB に残っている古い読み解きを、いまのロジックで上書きするときは（検証用・通常保存では再生成しません）:
              </p>
              <button
                type="button"
                className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-950 hover:bg-amber-100 disabled:opacity-50"
                disabled={owlRegenLoading || saving || loadingEdit}
                onClick={() => void regenerateOwlCommentOnce()}
              >
                {owlRegenLoading ? "再生成中…" : "この記録の読み解きだけ再生成"}
              </button>
            </div>
          </details>
        ) : null}
        <label className="block text-sm font-medium text-stone-700" htmlFor="journal-mood">
          今日の気分
        </label>
        <select
          id="journal-mood"
          value={mood}
          onChange={(e) => setMood(e.target.value as MoodId)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none ring-stone-400 focus:ring-2"
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
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none ring-stone-400 focus:ring-2"
        >
          {activityOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        </div>

        <div className="flex flex-col gap-2 border-t border-stone-100 pt-3 sm:flex-row sm:flex-wrap sm:justify-end">
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
                setExistingPhotoSrc("");
                setPhotoDirty(false);
                setSelectedPhotoFile(null);
                setMood("calm");
                setActivity("record_anyway");
                setContentFontMode(DEFAULT_CONTENT_FONT_MODE);
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
                  setExistingPhotoSrc("");
                  setPhotoDirty(false);
                  setSelectedPhotoFile(null);
                  setMood("calm");
                  setActivity("record_anyway");
                  setContentFontMode(DEFAULT_CONTENT_FONT_MODE);
                  setEntryDate(toDateInputValue(new Date()));
                  router.replace("/journal");
                }}
                className="whitespace-nowrap rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:opacity-60"
              >
                編集をやめる
              </button>
            ) : null}
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
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 flex-1 text-sm text-stone-700">
                    {getMoodMeta(entry.mood).emoji} {getMoodMeta(entry.mood).label}
                  </p>
                  <div className="relative z-10 flex shrink-0 flex-wrap items-center justify-end gap-x-3 gap-y-1">
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
                        router.push(
                          `/journal/preview?entry=${encodeURIComponent(entry.id)}&theme=simple_plain&pv=3`,
                        );
                      }}
                    >
                      プレビュー
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === entry.id}
                      className="shrink-0 px-0.5 py-1 text-xs text-red-600 underline underline-offset-2 hover:text-red-700 disabled:opacity-50"
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
                  伴走キャラ:{" "}
                  {getCompanionLabel(PHASE1_COMPANION_TYPE)}
                </p>
                {entry.hasPhoto === true ? (
                  <p className="mt-2 text-xs text-stone-500">写真あり（編集で表示）</p>
                ) : null}
                <p className="whitespace-pre-wrap leading-7 text-stone-800">{entry.content}</p>
                {entry.generatedComment ? (
                  <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2">
                    <p className="text-xs font-medium text-emerald-900">
                      {getCompanionReadingHeading(PHASE1_COMPANION_TYPE)}
                    </p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-emerald-900/90">
                      {entry.generatedComment}
                    </p>
                  </div>
                ) : kanteiOrderExists === false ? (
                  <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
                    <p className="text-xs font-medium text-stone-700">
                      {getCompanionReadingHeading(PHASE1_COMPANION_TYPE)}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-stone-600">
                      {JOURNAL_OWL_COMMENT_KANTEI_REQUIRED_MESSAGE}
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
