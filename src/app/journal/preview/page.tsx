"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { JournalPreviewSpread } from "@/components/journal/JournalPreviewSpread";
import { JournalReadablePreview } from "@/components/journal/JournalReadablePreview";
import { ActiveProfileLabel } from "@/components/profile/ActiveProfileLabel";
import { useEnsureServerAuthSession } from "@/hooks/useEnsureServerAuthSession";
import { useEnsureActiveViewerProfile } from "@/hooks/useEnsureActiveViewerProfile";
import { useEntitlement } from "@/components/entitlement/useEntitlement";
import { JOURNAL_BOOK_PREVIEW_NOTICE } from "@/lib/journal/journalDiaryNumbersHelpCopy";
import { journalEditPath } from "@/lib/journal/journalNav";
import { getDiaryDesignLabel, normalizeDiaryDesignTheme, type DiaryDesignId } from "@/lib/journal/meta";

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

type ViewMode = "readable" | "book";

function JournalPreviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entryId = searchParams.get("entry");
  const themeParam = searchParams.get("theme");
  const returnToRaw = searchParams.get("returnTo");
  const returnTo =
    returnToRaw && returnToRaw.startsWith("/") && !returnToRaw.startsWith("//") ? returnToRaw : null;
  const [entry, setEntry] = useState<PreviewEntry | null>(null);
  const [kanteiOrderExists, setKanteiOrderExists] = useState<boolean | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("readable");
  const authSession = useEnsureServerAuthSession();
  const { entitlement } = useEntitlement();
  const canEditJournal = entitlement?.canUseContinuedFeatures ?? true;
  const profileState = useEnsureActiveViewerProfile({
    redirectIfMissing: "/orders",
  });

  useEffect(() => {
    if (!entryId) {
      setLoading(false);
      setError("表示する記録が指定されていません。");
      return;
    }
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
          kanteiOrderExists?: boolean;
          error?: string;
        };
        if (!res.ok || !data.entry) {
          throw new Error(data.error ?? "プレビュー対象の読み込みに失敗しました。");
        }
        if (!cancelled) {
          setEntry(data.entry);
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
  }, [entryId, authSession.ready]);

  const designTheme: DiaryDesignId = useMemo(() => {
    if (themeParam?.trim()) return normalizeDiaryDesignTheme(themeParam);
    if (!entry?.designTheme) return "simple_plain";
    return normalizeDiaryDesignTheme(entry.designTheme);
  }, [entry?.designTheme, themeParam]);

  const effectiveProfileId =
    profileState.effectiveProfileId ||
    entry?.profileId?.trim() ||
    "";

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div>
          <h1 className="text-[1.375rem] font-bold text-stone-900 sm:text-[1.75rem]">日記プレビュー</h1>
          {profileState.ready && profileState.hasProfiles ? (
            <ActiveProfileLabel nickname={profileState.activeProfileNickname} className="mt-2" />
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
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
            onClick={() => setViewMode("book")}
            className={[
              "min-h-[44px] rounded-md border px-3 py-2 text-base",
              viewMode === "book"
                ? "border-stone-700 bg-stone-800 text-white"
                : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
            ].join(" ")}
          >
            製本イメージ
          </button>
        </div>
      </div>

      <div
        className={
          viewMode === "book"
            ? "sm:rounded-xl sm:border sm:border-stone-200 sm:bg-white sm:p-4 sm:shadow-sm"
            : ""
        }
      >
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
            photoDataUrl={entry.photoDataUrl}
            photoSrc={entry.photoSrc}
            hasPhoto={entry.hasPhoto}
            generatedComment={entry.generatedComment}
            diaryNumbers={entry.diaryNumbers}
            kanteiOrderExists={kanteiOrderExists}
            returnTo={returnTo}
            profileId={effectiveProfileId || entry.profileId}
            canEdit={canEditJournal}
          />
        ) : (
          <div className="space-y-3">
            <p className="text-xs leading-relaxed text-stone-500">{JOURNAL_BOOK_PREVIEW_NOTICE}</p>
            <p className="hidden text-sm text-stone-600 sm:block">
              デザイン: {getDiaryDesignLabel(designTheme)}
            </p>
            <JournalPreviewSpread
              designTheme={designTheme}
              companionType={entry.companionType}
              mood={entry.mood}
              activity={entry.activity}
              content={entry.content}
              comment={entry.generatedComment}
              photoDataUrl={entry.photoDataUrl}
              photoSrc={entry.photoSrc ?? null}
              previewDate={new Date(entry.createdAt)}
              diaryNumbers={entry.diaryNumbers}
              contentFontMode={entry.contentFontMode}
              kanteiOrderExists={kanteiOrderExists}
              returnTo={returnTo}
              returnHomeLabel={
                returnTo?.startsWith("/orders/calendar") ? "カレンダーへ戻る" : "一覧に戻る"
              }
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-0">
        {returnTo ? (
          <Link
            href={returnTo}
            className="relative z-[1] min-h-[44px] rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-base font-medium text-emerald-900 hover:bg-emerald-100 active:bg-emerald-100/90"
          >
            {returnTo.startsWith("/orders/calendar") ? "カレンダーへ戻る" : "一覧に戻る"}
          </Link>
        ) : null}
        {canEditJournal && entry ? (
          <button
            type="button"
            onClick={() => {
              router.push(
                journalEditPath(
                  entry.id,
                  returnTo ?? "/journal/preview",
                  effectiveProfileId || entry.profileId,
                ),
              );
            }}
            className="min-h-[44px] rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-base text-stone-700 hover:bg-stone-50"
          >
            この記録を編集する
          </button>
        ) : null}
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
