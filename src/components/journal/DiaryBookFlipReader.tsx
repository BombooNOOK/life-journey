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
import { DiaryPreviewFixedPage } from "@/components/journal/DiaryPreviewFixedPage";
import { InlineHelpButton } from "@/components/ui/InlineHelpButton";
import { useVisualViewportDock } from "@/hooks/useVisualViewportDock";
import type { BoundDiaryEntry } from "@/components/journal/DiaryYearBoundPages";
import { parseSafeJournalReturnTo } from "@/lib/journal/bookshelfReturnTo";
import { diaryBookBodyTemplatePathForCompanion } from "@/lib/journal/diaryBookAssets";
import { filterEntriesForDiaryBook } from "@/lib/journal/includeInBook";
import {
  boundDiaryBookPageLabel,
  buildBoundDiaryBookPages,
  diaryBookDisplayYear,
} from "@/lib/journal/diaryBookPages";
import { normalizeContentFontMode } from "@/lib/journal/contentFontMode";
import { normalizeDiaryDesignTheme, type DiaryDesignId } from "@/lib/journal/meta";

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
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pParam = searchParams.get("p");
  const displayYear = diaryBookDisplayYear(startDate);

  const [entries, setEntries] = useState<BoundDiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
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

  const openFullscreen = useCallback(() => {
    setFullscreenOpen(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetch(`/api/journal/diary-books/${encodeURIComponent(bookId)}/entries?_=${Date.now()}`, {
      cache: "no-store",
      credentials: "same-origin",
    })
      .then(async (res) => {
        const data = (await res.json()) as { entries?: BoundDiaryEntry[]; error?: string };
        if (!res.ok) throw new Error(data.error ?? "記録の取得に失敗しました。");
        const list = [...(data.entries ?? [])].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        if (!cancelled) {
          setEntries(list);
          setPanelVisible(true);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "記録の取得に失敗しました。");
          setEntries([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  const pages = useMemo(
    () => buildBoundDiaryBookPages(entries, startDate, endDate),
    [entries, startDate, endDate],
  );
  const totalPages = pages.length;
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
    if (totalPages < 1) return;
    let targetIdx = 0;
    if (pParam != null && /^\d+$/.test(pParam)) {
      const p1 = parseInt(pParam, 10);
      if (p1 >= 1) {
        targetIdx = Math.min(totalPages - 1, p1 - 1);
      }
    }
    setPageIndex((prev) => (prev === targetIdx ? prev : targetIdx));
  }, [pParam, totalPages]);

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
    if (pageIndex >= totalPages) {
      const clamped = Math.max(0, totalPages - 1);
      setPageIndex(clamped);
      syncPageQuery(clamped);
    }
  }, [pageIndex, totalPages, syncPageQuery]);

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

  const entryTheme: DiaryDesignId = useMemo(() => {
    if (current?.kind !== "entry") return "simple_plain";
    const t = current.entry.designTheme;
    if (!t) return "simple_plain";
    return normalizeDiaryDesignTheme(t);
  }, [current]);

  const goToPage = useCallback(
    (next: number) => {
      if (next < 0 || next >= totalPages) return;
      const apply = () => {
        setPageIndex(next);
        syncPageQuery(next);
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
        setFullscreenOpen(false);
        return;
      }
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
      case "entry":
        return (
          <DiaryPreviewFixedPage
            designTheme={entryTheme}
            companionType={current.entry.companionType}
            mood={current.entry.mood}
            activity={current.entry.activity}
            content={current.entry.content}
            comment={current.entry.generatedComment}
            photoDataUrl={current.entry.photoDataUrl}
            previewDate={new Date(current.entry.createdAt)}
            diaryNumbers={current.entry.diaryNumbers}
            contentFontMode={normalizeContentFontMode(current.entry.contentFontMode)}
            showGoldFrame={false}
            templateSrc={diaryBookBodyTemplatePathForCompanion(current.entry.companionType)}
          />
        );
      case "back":
        return <DiaryBookBackCoverPage />;
      default:
        return null;
    }
  }, [current, coverTheme, endDate, entries, entryTheme, startDate, title]);

  if (loading) {
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
        <div
          className="fixed z-[100] overflow-hidden bg-[#f7f4ee]"
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
                onClick={() => setFullscreenOpen(false)}
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
      ) : null}
    </>
  );
}
