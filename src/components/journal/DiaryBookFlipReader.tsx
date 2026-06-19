"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  DiaryBookBackCoverPage,
  DiaryBookFreeWritingPage,
  DiaryBookFrontCoverPage,
  DiaryBookInsideCoverBackIllustrationPage,
  DiaryBookInsideCoverPage,
  DiaryBookMonthBodyOddAdjustmentPage,
  DiaryBookMonthIllustrationPage,
  DiaryBookMonthPage,
  DiaryBookPreBackCoverIllustrationPage,
} from "@/components/journal/DiaryBookBoundPages";
import { DiaryBookPageViewport } from "@/components/journal/DiaryBookPageViewport";
import { DiaryBookEntryV2PreviewPage } from "@/components/journal/DiaryBookEntryV2PreviewPage";
import { BodyPortal, IMMERSIVE_OVERLAY_Z_CLASS } from "@/components/ui/BodyPortal";
import { InlineHelpButton } from "@/components/ui/InlineHelpButton";
import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";
import { BookshelfEditIncludesNavButton } from "@/components/orders/BookshelfEditIncludesNavButton";
import { useDiaryBookEntryPhotos } from "@/hooks/useDiaryBookEntryPhotos";
import { parseFetchJsonResponse } from "@/lib/http/parseFetchJson";
import { useVisualViewportDock } from "@/hooks/useVisualViewportDock";
import type { BoundDiaryEntry } from "@/components/journal/DiaryYearBoundPages";
import { parseSafeJournalReturnTo } from "@/lib/journal/bookshelfReturnTo";
import { filterEntriesForDiaryBook } from "@/lib/journal/includeInBook";
import {
  boundDiaryBookPageLabel,
  buildBoundDiaryBookPages,
  sortBoundDiaryEntriesChronological,
  diaryBookDisplayYear,
} from "@/lib/journal/diaryBookPages";
import { normalizeContentFontMode } from "@/lib/journal/contentFontMode";

const READER_HELP_TEXT =
  "表紙・中表紙のあと、期間内の月カレンダーと日記本文が続きます。PCはキーボードの左右矢印、スマホはスワイプでもめくれます。";

const FULLSCREEN_HELP_TOUCH =
  "左右にスワイプしてページをめくれます。画面をタップするとメニューを表示できます。";

const FULLSCREEN_HELP_POINTER =
  "左右の矢印キーでページをめくれます。画面をクリックするとメニューを表示できます。";

function useFullscreenReaderHintText(): string {
  const [hint, setHint] = useState(FULLSCREEN_HELP_POINTER);

  useEffect(() => {
    const touchQuery = window.matchMedia("(pointer: coarse)");
    const update = () => {
      setHint(touchQuery.matches ? FULLSCREEN_HELP_TOUCH : FULLSCREEN_HELP_POINTER);
    };
    update();
    touchQuery.addEventListener("change", update);
    return () => touchQuery.removeEventListener("change", update);
  }, []);

  return hint;
}

const FULLSCREEN_ENTER_BUTTON_CLASS =
  "inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-[#faf8f5] px-3 py-1.5 text-xs font-medium text-stone-900 shadow-sm transition hover:border-stone-400 hover:bg-white active:scale-[0.98] sm:text-sm";

type Props = {
  bookId: string;
  title: string;
  startDate: string;
  endDate: string;
  coverTheme: string;
  profileId: string;
  /** SSR 初期値。ヘッダーバッジと黄色カードで共有 */
  initialNeedsContentRefresh?: boolean;
  onNeedsContentRefreshChange?: (needsContentRefresh: boolean) => void;
};

function backLabelForHref(href: string): string {
  if (href.startsWith("/orders/calendar")) return "カレンダーへ戻る";
  if (/^\/orders\/bookshelf\/diary\/\d{4}$/.test(href.split("?")[0] ?? "")) return "日記一覧へ戻る";
  if (href.startsWith("/orders/bookshelf")) return "本棚へ戻る";
  return "戻る";
}

export function DiaryBookFlipReader({
  bookId,
  title,
  startDate,
  endDate,
  coverTheme,
  profileId,
  initialNeedsContentRefresh = false,
  onNeedsContentRefreshChange,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pParam = searchParams.get("p");
  const displayYear = diaryBookDisplayYear(startDate);

  const { getPhotoDataUrl, shouldShowPhotoLoading, prefetchEntryIds, resetCache } =
    useDiaryBookEntryPhotos();

  const [entries, setEntries] = useState<BoundDiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [needsContentRefresh, setNeedsContentRefresh] = useState(
    () => initialNeedsContentRefresh === true,
  );
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [panelVisible, setPanelVisible] = useState(true);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [fullscreenChromeVisible, setFullscreenChromeVisible] = useState(false);
  const viewportDock = useVisualViewportDock(fullscreenOpen);
  const fullscreenHintText = useFullscreenReaderHintText();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const didSwipeRef = useRef(false);
  const tapHandledRef = useRef(false);
  const urlPageInitializedRef = useRef(false);
  const pageIndexRef = useRef(0);
  /** router.replace 完了前に URL の p が古い値のまま effect で上書きされるのを防ぐ */
  const suppressUrlPageSyncUntilRef = useRef(0);

  const openFullscreen = useCallback(() => {
    setFullscreenOpen(true);
  }, []);

  const loadEntries = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/journal/diary-books/${encodeURIComponent(bookId)}/entries?_=${Date.now()}`,
        { cache: "no-store", credentials: "same-origin" },
      );
      const data = await parseFetchJsonResponse<{
        entries?: BoundDiaryEntry[];
        needsContentRefresh?: boolean;
        error?: string;
      }>(res, "記録の取得に失敗しました。");
      if (!res.ok) throw new Error(data.error ?? "記録の取得に失敗しました。");
      const list = sortBoundDiaryEntriesChronological(data.entries ?? []);
      resetCache();
      setEntries(list);
      setNeedsContentRefresh(data.needsContentRefresh === true);
      setPanelVisible(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "記録の取得に失敗しました。");
      setEntries([]);
      setNeedsContentRefresh(false);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [bookId, resetCache]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    onNeedsContentRefreshChange?.(needsContentRefresh);
  }, [needsContentRefresh, onNeedsContentRefreshChange]);

  const pages = useMemo(
    () => buildBoundDiaryBookPages(entries, startDate, endDate),
    [entries, startDate, endDate],
  );
  const totalPages = pages.length;

  useEffect(() => {
    const toPrefetch: Array<{ id: string; hasPhoto?: boolean }> = [];
    for (const idx of [pageIndex - 1, pageIndex, pageIndex + 1]) {
      if (idx < 0 || idx >= totalPages) continue;
      const page = pages[idx];
      if (page?.kind === "entry" && page.entry.hasPhoto) {
        toPrefetch.push({ id: page.entry.id, hasPhoto: true });
      }
    }
    prefetchEntryIds(toPrefetch);
  }, [pageIndex, pages, totalPages, prefetchEntryIds]);

  const refreshDiaryBookContent = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/journal/diary-books/${encodeURIComponent(bookId)}/refresh`,
        { method: "POST", credentials: "same-origin" },
      );
      const data = await parseFetchJsonResponse<{
        error?: string;
        needsContentRefresh?: boolean;
      }>(res, "日記ブックの更新に失敗しました。");
      if (!res.ok) throw new Error(data.error ?? "日記ブックの更新に失敗しました。");
      setNeedsContentRefresh(data.needsContentRefresh === true);
      await loadEntries({ silent: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "日記ブックの更新に失敗しました。");
    } finally {
      setRefreshing(false);
    }
  }, [bookId, loadEntries]);

  const entryTotal = filterEntriesForDiaryBook(entries).length;

  const backHref = useMemo(() => {
    const fromQuery = parseSafeJournalReturnTo(searchParams.get("returnTo"));
    return fromQuery ?? "/orders/bookshelf";
  }, [searchParams]);
  const backLabel = backLabelForHref(backHref);

  const syncPageQuery = useCallback(
    (nextIndex: number) => {
      const qs = new URLSearchParams(searchParams.toString());
      qs.set("p", String(nextIndex + 1));
      const nextUrl = `${pathname}?${qs.toString()}`;
      const currentUrl = `${pathname}?${searchParams.toString()}`;
      if (nextUrl === currentUrl) return;
      router.replace(nextUrl, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (totalPages < 1 || urlPageInitializedRef.current) return;
    let targetIdx = 0;
    if (pParam != null && /^\d+$/.test(pParam)) {
      const p1 = parseInt(pParam, 10);
      if (p1 >= 1) {
        targetIdx = Math.min(totalPages - 1, p1 - 1);
      }
    }
    setPageIndex(targetIdx);
    urlPageInitializedRef.current = true;
  }, [pParam, totalPages]);

  useEffect(() => {
    if (!urlPageInitializedRef.current || totalPages < 1) return;
    setPageIndex((prev) => Math.min(prev, totalPages - 1));
  }, [totalPages]);

  useEffect(() => {
    pageIndexRef.current = pageIndex;
  }, [pageIndex]);

  useEffect(() => {
    if (fullscreenOpen) return;
    if (!urlPageInitializedRef.current || totalPages < 1) return;
    if (Date.now() < suppressUrlPageSyncUntilRef.current) return;
    if (pParam == null || !/^\d+$/.test(pParam)) return;

    const urlIdx = Math.min(totalPages - 1, parseInt(pParam, 10) - 1);
    if (urlIdx < 0) return;
    setPageIndex((prev) => (prev === urlIdx ? prev : urlIdx));
  }, [pParam, totalPages, fullscreenOpen]);

  const closeFullscreen = useCallback(() => {
    const idx = pageIndexRef.current;
    suppressUrlPageSyncUntilRef.current = Date.now() + 800;
    syncPageQuery(idx);
    setFullscreenOpen(false);
  }, [syncPageQuery]);

  const editReturnToParam = useMemo(() => {
    const qs = new URLSearchParams(searchParams.toString());
    qs.set("p", String(pageIndex + 1));
    return encodeURIComponent(`${pathname}?${qs.toString()}`);
  }, [pathname, searchParams, pageIndex]);

  const latestEntryPageIndex = useMemo(() => {
    for (let i = pages.length - 1; i >= 0; i -= 1) {
      if (pages[i]?.kind === "entry") return i;
    }
    return Math.max(0, pages.length - 1);
  }, [pages]);

  const canBackFromCover = useMemo(() => pages.some((p) => p.kind === "entry"), [pages]);

  useEffect(() => {
    if (!fullscreenOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fullscreenOpen]);

  useEffect(() => {
    if (!fullscreenOpen) {
      setFullscreenChromeVisible(false);
    }
  }, [fullscreenOpen]);

  useEffect(() => {
    if (!fullscreenChromeVisible) return;
    const timer = window.setTimeout(() => setFullscreenChromeVisible(false), 4000);
    return () => window.clearTimeout(timer);
  }, [fullscreenChromeVisible, pageIndex]);

  const fullscreenShellStyle = useMemo(() => {
    if (viewportDock.width > 0 && viewportDock.height > 0) {
      return {
        top: viewportDock.offsetTop,
        left: viewportDock.offsetLeft,
        width: viewportDock.width,
        height: viewportDock.height,
      } as const;
    }
    return {
      top: 0,
      left: 0,
      width: "100%",
      height: "100dvh",
    } as const;
  }, [viewportDock]);

  const current = pages[pageIndex];

  const goToPage = useCallback(
    (next: number) => {
      if (next < 0 || next >= totalPages) return;
      pageIndexRef.current = next;
      const apply = () => {
        setPageIndex(next);
        if (!fullscreenOpen) {
          suppressUrlPageSyncUntilRef.current = Date.now() + 600;
          syncPageQuery(next);
        }
        setPanelVisible(true);
      };
      if (fullscreenOpen) {
        apply();
        return;
      }
      setPanelVisible(false);
      window.setTimeout(apply, 220);
    },
    [fullscreenOpen, syncPageQuery, totalPages],
  );

  const tryGoDelta = useCallback(
    (delta: number) => {
      let next = pageIndex + delta;
      if (pageIndex === 0 && delta < 0) {
        const hasEntryPage = pages.some((p) => p.kind === "entry");
        if (!hasEntryPage) return;
        next = latestEntryPageIndex;
      }
      if (next < 0 || next >= totalPages) return;
      goToPage(next);
    },
    [goToPage, latestEntryPageIndex, pageIndex, pages, totalPages],
  );

  const tryGoFirst = useCallback(() => {
    goToPage(0);
  }, [goToPage]);

  const tryGoLast = useCallback(() => {
    goToPage(totalPages - 1);
  }, [goToPage, totalPages]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && fullscreenOpen) {
        e.preventDefault();
        closeFullscreen();
        return;
      }
      if (!fullscreenOpen) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        tryGoDelta(1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        tryGoDelta(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreenOpen, tryGoDelta]);

  const onTouchStart = useCallback((e: React.TouchEvent<HTMLElement>) => {
    didSwipeRef.current = false;
    const t = e.touches[0];
    if (!t) return;
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLElement>) => {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!start) return;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      const isTap = Math.abs(dx) < 12 && Math.abs(dy) < 12;
      if (Math.abs(dx) < 44 || Math.abs(dx) < Math.abs(dy) * 1.15) {
        if (isTap) {
          if (fullscreenOpen) {
            setFullscreenChromeVisible((v) => !v);
          } else {
            tapHandledRef.current = true;
            openFullscreen();
            window.setTimeout(() => {
              tapHandledRef.current = false;
            }, 400);
          }
        }
        return;
      }
      didSwipeRef.current = true;
      if (dx < 0) {
        tryGoDelta(1);
      } else {
        tryGoDelta(-1);
      }
    },
    [fullscreenOpen, openFullscreen, tryGoDelta],
  );

  const onNormalViewerClick = useCallback(() => {
    if (tapHandledRef.current || didSwipeRef.current) return;
    openFullscreen();
  }, [openFullscreen]);

  const onFullscreenAreaClick = useCallback(() => {
    if (didSwipeRef.current) return;
    setFullscreenChromeVisible((v) => !v);
  }, []);

  const pageContent = useMemo(() => {
    if (!current) return null;
    switch (current.kind) {
      case "cover":
        return <DiaryBookFrontCoverPage coverTheme={coverTheme} />;
      case "inside-cover":
        return <DiaryBookInsideCoverPage title={title} startDate={startDate} endDate={endDate} />;
      case "inside-cover-back-illustration":
        return <DiaryBookInsideCoverBackIllustrationPage />;
      case "month-index":
        return (
          <DiaryBookMonthPage
            year={current.calendarYear}
            monthIndex={current.monthIndex}
            entries={entries}
          />
        );
      case "month-illustration":
        return (
          <DiaryBookMonthIllustrationPage
            year={current.calendarYear}
            monthIndex={current.monthIndex}
          />
        );
      case "month-body-odd-adjustment":
        return (
          <DiaryBookMonthBodyOddAdjustmentPage
            year={current.calendarYear}
            monthIndex={current.monthIndex}
          />
        );
      case "free-writing":
        return <DiaryBookFreeWritingPage spreadSide={current.spreadSide} />;
      case "pre-back-cover-illustration":
        return <DiaryBookPreBackCoverIllustrationPage />;
      case "entry": {
        const entry = current.entry;
        const resolvedPhoto = getPhotoDataUrl(entry.id);
        const photoLoading =
          shouldShowPhotoLoading(entry.id, entry.hasPhoto) && !resolvedPhoto;
        return (
          <DiaryBookEntryV2PreviewPage
            companionType={entry.companionType}
            mood={entry.mood}
            activity={entry.activity}
            content={entry.content}
            comment={entry.generatedComment}
            photoDataUrl={resolvedPhoto}
            photoLoading={photoLoading}
            previewDate={new Date(entry.createdAt)}
            diaryNumbers={entry.diaryNumbers}
            contentFontMode={normalizeContentFontMode(entry.contentFontMode)}
          />
        );
      }
      case "back":
        return <DiaryBookBackCoverPage />;
      default:
        return null;
    }
  }, [current, coverTheme, endDate, entries, getPhotoDataUrl, shouldShowPhotoLoading, startDate, title]);

  if (loading && entries.length === 0) {
    return <p className="text-sm text-stone-500">日記ブックを読み込み中…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-700">{error}</p>;
  }

  if (!current) {
    return (
      <p className="text-sm text-stone-600">
        この期間に表示できる日記がありません。本棚に戻って期間を確認してください。
      </p>
    );
  }

  const entryPageLabel =
    current.kind === "entry" ? boundDiaryBookPageLabel(current, displayYear, entryTotal) : null;
  const prevDisabled = pageIndex === 0 ? !canBackFromCover : false;
  const nextDisabled = pageIndex >= totalPages - 1;
  const firstDisabled = pageIndex === 0;
  const lastDisabled = pageIndex >= totalPages - 1;
  const entryEditHref =
    current.kind === "entry"
      ? `/journal?profile=${encodeURIComponent(profileId)}&edit=${encodeURIComponent(current.entry.id)}&returnTo=${editReturnToParam}`
      : null;

  const normalPageViewport = (
    <div
      className={[
        "w-full transition duration-300 ease-out",
        panelVisible ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0 sm:-translate-x-6",
      ].join(" ")}
    >
      <DiaryBookPageViewport fitMode="width">{pageContent}</DiaryBookPageViewport>
    </div>
  );

  const fullscreenPageViewport = (
    <DiaryBookPageViewport fitMode="maximize" fillHeight centered className="h-full w-full">
      {pageContent}
    </DiaryBookPageViewport>
  );

  const navButtonClass =
    "rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-800 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:py-1.5 sm:text-sm";
  const navLinkClass =
    "text-xs text-stone-500 underline-offset-2 hover:text-stone-800 hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline sm:text-sm";

  const pageStatus = (
    <span className="text-xs text-stone-700 sm:text-sm">
      <span className="font-medium text-stone-900">
        {pageIndex + 1} / {totalPages}
      </span>
      {entryPageLabel ? <span className="ml-2 text-stone-600">{entryPageLabel}</span> : null}
    </span>
  );

  return (
    <>
      <div className="space-y-3">
        {needsContentRefresh ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
            <p>
              日記の追加・編集、または本への掲載変更があります。内容を反映するには更新してください。
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={refreshing || loading}
                aria-busy={refreshing}
                onClick={() => void refreshDiaryBookContent()}
                className="rounded-lg bg-emerald-800 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-900 disabled:opacity-50"
              >
                {refreshing ? (
                  <OwlLoadingInline label="日記ブックを更新しています…" size="sm" />
                ) : (
                  "日記ブックを更新する"
                )}
              </button>
              <BookshelfEditIncludesNavButton
                bookId={bookId}
                className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-medium text-emerald-900 hover:bg-emerald-50"
              />
            </div>
          </div>
        ) : null}

        {/* 通常ビューワー：戻る・アクション */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <Link
            href={backHref}
            className="text-xs text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline sm:text-sm"
          >
            ← {backLabel}
          </Link>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm">
            {entryEditHref ? (
              <Link
                href={entryEditHref}
                className="font-medium text-emerald-800 underline-offset-2 hover:text-emerald-950 hover:underline"
              >
                この記事を編集
              </Link>
            ) : null}
            <button
              type="button"
              onClick={openFullscreen}
              className={FULLSCREEN_ENTER_BUTTON_CLASS}
            >
              <span aria-hidden className="text-[15px] leading-none">
                ⛶
              </span>
              全画面で読む
            </button>
          </div>
        </div>

        {/* 通常ビューワー：ページ移動 */}
        <div className="rounded-lg border border-stone-100 bg-stone-50/60 px-2.5 py-2 sm:px-3">
          <div className="hidden items-center justify-center gap-x-2.5 gap-y-1 sm:flex">
            <button
              type="button"
              disabled={firstDisabled}
              onClick={tryGoFirst}
              className={navLinkClass}
              aria-label="最初のページへ"
            >
              ≪ 最初
            </button>
            <button
              type="button"
              disabled={prevDisabled}
              onClick={() => tryGoDelta(-1)}
              className={navButtonClass}
            >
              ← 前へ
            </button>
            {pageStatus}
            <button
              type="button"
              disabled={nextDisabled}
              onClick={() => tryGoDelta(1)}
              className={navButtonClass}
            >
              次へ →
            </button>
            <button
              type="button"
              disabled={lastDisabled}
              onClick={tryGoLast}
              className={navLinkClass}
              aria-label="最後のページへ"
            >
              最後 ≫
            </button>
            <InlineHelpButton ariaLabel="日記ブックの読み方">{READER_HELP_TEXT}</InlineHelpButton>
          </div>

          <div className="space-y-1.5 sm:hidden">
            <div className="flex items-center justify-center gap-2">
              {pageStatus}
              <InlineHelpButton ariaLabel="日記ブックの読み方">{READER_HELP_TEXT}</InlineHelpButton>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <button
                type="button"
                disabled={firstDisabled}
                onClick={tryGoFirst}
                className={navLinkClass}
                aria-label="最初のページへ"
              >
                ≪ 最初
              </button>
              <button
                type="button"
                disabled={prevDisabled}
                onClick={() => tryGoDelta(-1)}
                className={navButtonClass}
              >
                ← 前へ
              </button>
              <button
                type="button"
                disabled={nextDisabled}
                onClick={() => tryGoDelta(1)}
                className={navButtonClass}
              >
                次へ →
              </button>
              <button
                type="button"
                disabled={lastDisabled}
                onClick={tryGoLast}
                className={navLinkClass}
                aria-label="最後のページへ"
              >
                最後 ≫
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onNormalViewerClick}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          aria-label="タップで全画面表示"
          className="group relative w-full cursor-zoom-in rounded-xl border border-stone-200 bg-[#faf8f4] p-2 text-left shadow-inner transition active:bg-[#f5f2ec] sm:p-3"
        >
          {normalPageViewport}
          <span
            className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-stone-900/20 px-2 py-0.5 text-[10px] text-white/95 opacity-90 backdrop-blur-[2px] transition group-hover:bg-stone-900/30 sm:bottom-2.5 sm:right-2.5 sm:text-[11px]"
            aria-hidden
          >
            <span className="text-[11px] leading-none sm:text-xs">⛶</span>
            タップで全画面
          </span>
        </button>
      </div>

      {fullscreenOpen ? (
        <BodyPortal>
          <div
            className={`fixed ${IMMERSIVE_OVERLAY_Z_CLASS} overflow-hidden bg-[#f7f4ee]`}
            style={fullscreenShellStyle}
            role="dialog"
            aria-modal="true"
            aria-label="日記ブック全画面ビューワー"
          >
            <div
              className="absolute inset-0 z-10 touch-pan-y"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              onClick={onFullscreenAreaClick}
              role="presentation"
            >
              {fullscreenPageViewport}
            </div>

            <div
              className={[
                "absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 px-3 pt-[max(0.35rem,env(safe-area-inset-top))] transition-opacity duration-200",
                fullscreenChromeVisible
                  ? "opacity-100"
                  : "pointer-events-none opacity-0",
              ].join(" ")}
            >
              <div
                className={[
                  "flex flex-wrap items-center gap-2",
                  fullscreenChromeVisible ? "pointer-events-auto" : "pointer-events-none",
                ].join(" ")}
              >
                <button
                  type="button"
                  onClick={closeFullscreen}
                  className="rounded-lg border border-stone-200 bg-white/95 px-3 py-2 text-sm font-medium text-stone-800 shadow-sm backdrop-blur-sm"
                >
                  通常表示に戻る
                </button>
                <Link
                  href={backHref}
                  className="rounded-lg border border-stone-200 bg-white/95 px-3 py-2 text-sm font-medium text-stone-700 shadow-sm backdrop-blur-sm"
                >
                  {backLabel}
                </Link>
              </div>
              <p className="rounded-lg bg-black/35 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                {pageIndex + 1} / {totalPages}
              </p>
            </div>

            <p
              className={[
                "pointer-events-none absolute inset-x-0 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-20 text-center text-[11px] text-stone-500 transition-opacity duration-200",
                fullscreenChromeVisible ? "opacity-0" : "opacity-70",
              ].join(" ")}
            >
              {fullscreenHintText}
            </p>
          </div>
        </BodyPortal>
      ) : null}
    </>
  );
}
