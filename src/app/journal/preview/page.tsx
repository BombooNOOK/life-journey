"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { JournalPreviewCompanionSwitcher } from "@/components/journal/JournalPreviewCompanionSwitcher";
import { JournalPreviewDayNav } from "@/components/journal/JournalPreviewDayNav";
import { JournalReadablePreview } from "@/components/journal/JournalReadablePreview";
import { JournalSocialPostImagePanel } from "@/components/journal/JournalSocialPostImagePanel";
import { ActiveProfileLabel } from "@/components/profile/ActiveProfileLabel";
import { useEnsureServerAuthSession } from "@/hooks/useEnsureServerAuthSession";
import { useEnsureActiveViewerProfile } from "@/hooks/useEnsureActiveViewerProfile";
import { useEntitlement } from "@/components/entitlement/useEntitlement";
import { normalizeContentFontMode } from "@/lib/journal/contentFontMode";
import { consumeJournalPreviewPrefetch, peekJournalPreviewPrefetch } from "@/lib/journal/journalPreviewPrefetch";
import { journalEditPath } from "@/lib/journal/journalNav";
import { normalizeCompanionType, normalizeDiaryDesignTheme, type CompanionType, type DiaryDesignId } from "@/lib/journal/meta";
import type { JournalPreviewNeighbors } from "@/lib/journal/journalPreviewNeighbors";

type PreviewEntry = {
  id: string;
  content: string;
  createdAt: string;
  mood: string;
  activity: string;
  companionType: string;
  designTheme?: DiaryDesignId;
  contentFontMode?: string;
  profileId?: string;
  photoDataUrl: string | null;
  photoSrc?: string | null;
  hasPhoto?: boolean;
  generatedComment: string | null;
  diaryNumbers?: {
    today: number;
    month: number;
    year: number;
    calmness: number;
  };
  kanteiOrderExists?: boolean;
};

type ViewMode = "readable" | "social";

function toDateInputValueUtc(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function JournalPreviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entryId = searchParams.get("entry");
  const themeParam = searchParams.get("theme");
  const returnToRaw = searchParams.get("returnTo");
  const returnTo =
    returnToRaw && returnToRaw.startsWith("/") && !returnToRaw.startsWith("//") ? returnToRaw : null;
  const [entry, setEntry] = useState<PreviewEntry | null>(null);
  const [neighbors, setNeighbors] = useState<JournalPreviewNeighbors>({ prev: null, next: null });
  const [kanteiOrderExists, setKanteiOrderExists] = useState<boolean | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("readable");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [hydratedFromPrefetch, setHydratedFromPrefetch] = useState(false);
  const [companionSwitching, setCompanionSwitching] = useState(false);
  const [companionSwitchError, setCompanionSwitchError] = useState<string | null>(null);
  const authSession = useEnsureServerAuthSession();
  const { entitlement } = useEntitlement();
  const canEditJournal = entitlement?.canUseContinuedFeatures ?? true;
  const profileState = useEnsureActiveViewerProfile({
    redirectIfMissing: "/orders",
  });

  useLayoutEffect(() => {
    if (!entryId) return;
    const prefetched = peekJournalPreviewPrefetch(entryId);
    if (!prefetched) return;
    setEntry(prefetched.entry as PreviewEntry);
    setNeighbors(prefetched.neighbors);
    setKanteiOrderExists(prefetched.kanteiOrderExists);
    setLoading(false);
    setError(null);
    setHydratedFromPrefetch(true);
    consumeJournalPreviewPrefetch(entryId);
  }, [entryId]);

  useEffect(() => {
    if (!entryId) {
      setLoading(false);
      setError("表示する記録が指定されていません。");
      return;
    }
    if (hydratedFromPrefetch) return;
    if (!authSession.ready) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetch(`/api/journal/${encodeURIComponent(entryId)}`, {
      cache: "no-store",
      credentials: "same-origin",
    })
      .then(async (res) => {
        const data = (await res.json()) as {
          entry?: PreviewEntry;
          neighbors?: JournalPreviewNeighbors;
          kanteiOrderExists?: boolean;
          error?: string;
        };
        if (!res.ok || !data.entry) {
          throw new Error(data.error ?? "プレビュー対象の読み込みに失敗しました。");
        }
        if (!cancelled) {
          setEntry(data.entry);
          setNeighbors(data.neighbors ?? { prev: null, next: null });
          setKanteiOrderExists(data.kanteiOrderExists);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "プレビュー対象の読み込みに失敗しました。");
          setEntry(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entryId, authSession.ready, hydratedFromPrefetch]);

  const designTheme: DiaryDesignId = useMemo(() => {
    if (themeParam?.trim()) return normalizeDiaryDesignTheme(themeParam);
    if (!entry?.designTheme) return "simple_plain";
    return normalizeDiaryDesignTheme(entry.designTheme);
  }, [entry?.designTheme, themeParam]);

  const effectiveProfileId =
    profileState.effectiveProfileId ||
    entry?.profileId?.trim() ||
    "";

  const meaningsReturnTo = useMemo(() => {
    if (!entryId) return null;
    const qs = new URLSearchParams({
      entry: entryId,
      theme: designTheme,
      pv: "3",
    });
    if (returnTo) qs.set("returnTo", returnTo);
    if (effectiveProfileId) qs.set("profile", effectiveProfileId);
    return `/journal/preview?${qs.toString()}`;
  }, [entryId, designTheme, returnTo, effectiveProfileId]);

  const returnHomeLabel = returnTo?.startsWith("/orders/calendar")
    ? "カレンダーへ戻る"
    : returnTo?.startsWith("/orders/list")
      ? "日記一覧へ戻る"
      : "一覧に戻る";

  const afterDeleteHref = returnTo ?? "/orders/list";

  async function refetchPreviewEntry(id: string) {
    const res = await fetch(`/api/journal/${encodeURIComponent(id)}`, {
      cache: "no-store",
      credentials: "same-origin",
    });
    const data = (await res.json()) as {
      entry?: PreviewEntry;
      neighbors?: JournalPreviewNeighbors;
      kanteiOrderExists?: boolean;
      error?: string;
    };
    if (!res.ok || !data.entry) {
      throw new Error(data.error ?? "プレビュー対象の読み込みに失敗しました。");
    }
    setEntry(data.entry);
    setNeighbors(data.neighbors ?? { prev: null, next: null });
    setKanteiOrderExists(data.kanteiOrderExists);
  }

  async function handleCompanionChange(next: CompanionType) {
    if (!entry || companionSwitching) return;
    if (normalizeCompanionType(entry.companionType) === next) return;

    setCompanionSwitching(true);
    setCompanionSwitchError(null);
    try {
      const res = await fetch(`/api/journal/${encodeURIComponent(entry.id)}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: entry.content,
          mood: entry.mood,
          activity: entry.activity,
          companionType: next,
          designTheme: entry.designTheme ?? designTheme,
          contentFontMode: normalizeContentFontMode(entry.contentFontMode),
          photoUnchanged: true,
          entryDate: toDateInputValueUtc(new Date(entry.createdAt)),
          effectiveProfileId: effectiveProfileId || entry.profileId,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "伴走キャラの切り替えに失敗しました。");
      }
      await refetchPreviewEntry(entry.id);
    } catch (e) {
      setCompanionSwitchError(
        e instanceof Error ? e.message : "伴走キャラの切り替えに失敗しました。",
      );
    } finally {
      setCompanionSwitching(false);
    }
  }

  const companionSwitcherBlock =
    canEditJournal && entry ? (
      <div className="space-y-2">
        <JournalPreviewCompanionSwitcher
          value={entry.companionType}
          disabled={loading || deleting}
          switching={companionSwitching}
          onChange={(next) => void handleCompanionChange(next)}
        />
        {companionSwitchError ? (
          <p className="text-sm text-red-700">{companionSwitchError}</p>
        ) : null}
      </div>
    ) : null;

  async function handleDeleteEntry() {
    if (!entry || deleting) return;
    const ok = window.confirm("この日記を本当に削除しますか？");
    if (!ok) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/journal/${encodeURIComponent(entry.id)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "削除に失敗しました。");
      }
      router.push(afterDeleteHref);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "削除に失敗しました。");
    } finally {
      setDeleting(false);
    }
  }

  return (
      <div className="space-y-5">
      <div className="space-y-3">
        <div>
          <h1 className="text-[1.375rem] font-bold text-stone-900 sm:text-[1.75rem]">日記プレビュー</h1>
          {profileState.ready && profileState.hasProfiles ? (
            <ActiveProfileLabel nickname={profileState.activeProfileNickname} className="mt-2" />
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode("readable")}
            className={[
              "min-h-[44px] rounded-md border px-3 py-2 text-base",
              viewMode === "readable"
                ? "border-stone-700 bg-stone-800 text-white"
                : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
            ].join(" ")}
          >
            読みやすく表示
          </button>
          <button
            type="button"
            onClick={() => setViewMode("social")}
            className={[
              "min-h-[44px] rounded-md border px-3 py-2 text-base",
              viewMode === "social"
                ? "border-stone-700 bg-stone-800 text-white"
                : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
            ].join(" ")}
          >
            投稿画像
          </button>
        </div>
      </div>

      <div>
        {loading ? (
          <p className="text-base text-stone-500">プレビューを読み込み中…</p>
        ) : error ? (
          <p className="text-base text-red-700">{error}</p>
        ) : !entry ? (
          <p className="text-base text-stone-500">表示する記録がありません。</p>
        ) : viewMode === "readable" ? (
          <JournalReadablePreview
            entryId={entry.id}
            createdAt={entry.createdAt}
            content={entry.content}
            mood={entry.mood}
            activity={entry.activity}
            companionType={entry.companionType}
            photoDataUrl={entry.photoDataUrl}
            photoSrc={entry.photoSrc}
            hasPhoto={entry.hasPhoto}
            generatedComment={entry.generatedComment}
            diaryNumbers={entry.diaryNumbers}
            kanteiOrderExists={kanteiOrderExists}
            returnTo={returnTo}
            profileId={effectiveProfileId || entry.profileId}
            canEdit={canEditJournal}
            meaningsReturnTo={meaningsReturnTo}
            afterCommentSlot={companionSwitcherBlock}
          />
        ) : viewMode === "social" ? (
          <JournalSocialPostImagePanel
            entryId={entry.id}
            content={entry.content}
            hasPhoto={entry.hasPhoto}
            photoSrc={entry.photoSrc}
          />
        ) : null}
      </div>

      {entry && (neighbors.prev || neighbors.next) ? (
        <JournalPreviewDayNav
          neighbors={neighbors}
          designTheme={designTheme}
          returnTo={returnTo}
          profileId={effectiveProfileId || entry.profileId}
        />
      ) : null}

      <div className="space-y-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:space-y-0 sm:pb-0">
        {returnTo ? (
          <Link
            href={returnTo}
            className="relative z-[1] inline-flex min-h-[44px] items-center rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-base font-medium text-emerald-900 hover:bg-emerald-100 active:bg-emerald-100/90"
          >
            {returnHomeLabel}
          </Link>
        ) : null}
        {canEditJournal && entry ? (
          <div className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 sm:max-w-md">
            <p className="text-sm font-medium text-stone-700">この日記を</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  router.push(
                    journalEditPath(
                      entry.id,
                      meaningsReturnTo ?? returnTo ?? "/journal/preview",
                      effectiveProfileId || entry.profileId,
                    ),
                  );
                }}
                className="min-h-[44px] rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-base text-stone-700 hover:bg-stone-50 disabled:opacity-60"
              >
                編集する
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void handleDeleteEntry()}
                className="min-h-[44px] rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-base font-medium text-red-800 hover:bg-red-100 disabled:opacity-60"
              >
                {deleting ? "削除中…" : "削除する"}
              </button>
            </div>
          </div>
        ) : null}
        {deleteError ? <p className="text-sm text-red-700">{deleteError}</p> : null}
        {!returnTo ? (
          <>
            {canEditJournal ? (
              <Link
                href={
                  effectiveProfileId
                    ? `/journal?profile=${encodeURIComponent(effectiveProfileId)}`
                    : "/journal"
                }
                className="min-h-[44px] rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-base text-stone-700 hover:bg-stone-50"
              >
                入力ページへ戻る
              </Link>
            ) : (
              <Link
                href="/orders/calendar"
                className="min-h-[44px] rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-base text-stone-700 hover:bg-stone-50"
              >
                カレンダーへ戻る
              </Link>
            )}
            <Link
              href="/orders/bookshelf"
              className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 hover:bg-amber-100"
            >
              本棚を見る
            </Link>
          </>
        ) : null}
      </div>
      </div>
  );
}

export default function JournalPreviewPage() {
  return (
    <Suspense fallback={<p className="text-sm text-stone-500">読み込み中…</p>}>
      <JournalPreviewPageContent />
    </Suspense>
  );
}
