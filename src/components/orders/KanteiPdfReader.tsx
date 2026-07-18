"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

import { KanteiFirstReadCompleteOverlay } from "@/components/orders/KanteiFirstReadCompleteOverlay";
import { KanteiPdfCanvasView } from "@/components/orders/KanteiPdfCanvasView";
import { KanteiPdfTocPanel } from "@/components/orders/KanteiPdfTocPanel";
import { PdfDownloadButton } from "@/components/orders/PdfDownloadButton";
import { BodyPortal, IMMERSIVE_OVERLAY_Z_CLASS } from "@/components/ui/BodyPortal";
import { OwlSpinIndicator } from "@/components/ui/OwlSpinIndicator";
import { useVisualViewportDock } from "@/hooks/useVisualViewportDock";
import {
  type KanteiFirstReadGuideMode,
  kanteiLifePathFirstPdfIndex,
  kanteiLifePathLastPdfIndex,
} from "@/lib/pdf/kanteiFirstReadGuide";
import {
  clampPdfIndex,
  formatKanteiReaderPageIndicator,
  KANTEI_PDF_COVER_INDEX,
  KANTEI_PDF_PHYSICAL_PAGE_COUNT,
  parsePdfPageSearchParam,
} from "@/lib/pdf/kanteiReaderPage";
import {
  openKanteiPdfDocument,
  resolveKanteiPdfNamedDestination,
} from "@/lib/pdf/loadKanteiPdfJs";
import { clearBookshelfKanteiGuideFlag } from "@/lib/onboarding/firstVisitWizard/session";
import {
  readLoghouseTourReturnHref,
  readLoghouseTourStep,
} from "@/lib/onboarding/firstVisitWizard/loghouseTour";
import { LOGHOUSE_TOUR_RETURN_LABEL } from "@/lib/onboarding/firstVisitWizard/loghouseTourCopy";
import { LogHouseTourKanteiAssist } from "@/components/orders/loghouse-room/LogHouseTourKanteiAssist";

const PDF_FETCH_TIMEOUT_MS = 310_000;
const LOAD_HINT_MS = 8_000;
const SWIPE_THRESHOLD_PX = 44;
const COMPACT_READER_HINT =
  "左右スワイプでめくる・ピンチで拡大・ダブルタップで戻す・タップで前後ボタン";
const PDF_LOADING_LABEL = "鑑定書を準備しています…" as const;
const PDF_LOADING_HINT =
  "初回は少し時間がかかることがあります。\nそのまま少しお待ちください。" as const;

type Props = {
  orderId: string;
  title: string;
  pdfPreviewHref: string;
  pdfDownloadHref: string;
  downloadFileName: string;
  backHref?: string;
  guideMode?: KanteiFirstReadGuideMode | null;
  activeProfileId?: string;
};

function storageKey(orderId: string): string {
  return `kantei-read-page:${orderId}`;
}

function useCompactReader(): boolean {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setCompact(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return compact;
}

function parsePdfFetchError(status: number, contentType: string, text: string): string {
  if (status === 401) return "ログインが切れています。本棚から再度お試しください。";
  if (status === 429) {
    return "閲覧回数の上限に達しています。時間をおいて再度お試しください。";
  }
  if (status === 504 || status === 524) {
    return "PDFの生成がタイムアウトしました。しばらく待ってから再試行してください。";
  }
  if (status >= 500) {
    return "鑑定書の準備中にサーバーエラーが発生しました。ページを再読み込みするか、しばらく待ってからお試しください。";
  }
  if (contentType.includes("application/json")) {
    try {
      const j = JSON.parse(text) as { error?: string; message?: string };
      return j.error ?? j.message ?? "PDFを取得できませんでした。";
    } catch {
      return "PDFを取得できませんでした。";
    }
  }
  return "PDFを取得できませんでした。";
}

export function KanteiPdfReader({
  orderId,
  title,
  pdfPreviewHref,
  pdfDownloadHref,
  downloadFileName,
  backHref = "/orders/bookshelf",
  guideMode = null,
  activeProfileId,
}: Props) {
  const router = useRouter();

  useEffect(() => {
    clearBookshelfKanteiGuideFlag();
  }, []);

  const [tourBack, setTourBack] = useState<{ href: string; label: string } | null>(null);
  useEffect(() => {
    if (readLoghouseTourStep()) {
      setTourBack({
        href: readLoghouseTourReturnHref(),
        label: `← ${LOGHOUSE_TOUR_RETURN_LABEL}`,
      });
      return;
    }
    setTourBack(null);
  }, []);

  const resolvedBackHref = tourBack?.href ?? backHref;
  const resolvedBackLabel = tourBack?.label ?? "← 本棚";
  const resolvedBackLabelLong = tourBack?.label ?? "← 本棚へ戻る";

  const restrictedFirstRead = guideMode != null;
  const isCompact = useCompactReader();
  const touchStartRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const didSwipeRef = useRef(false);
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
  const loadGenerationRef = useRef(0);

  const [reloadKey, setReloadKey] = useState(0);
  const [pdfIndex, setPdfIndex] = useState(KANTEI_PDF_COVER_INDEX);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pdfPageCount, setPdfPageCount] = useState(KANTEI_PDF_PHYSICAL_PAGE_COUNT);
  const [loading, setLoading] = useState(true);
  const [loadHint, setLoadHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tocOpen, setTocOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(false);
  const [firstReadCompleteOpen, setFirstReadCompleteOpen] = useState(false);
  const isPdfZoomedRef = useRef(false);

  const handlePdfZoomedChange = useCallback((zoomed: boolean) => {
    isPdfZoomedRef.current = zoomed;
  }, []);

  const viewportDock = useVisualViewportDock(isCompact && !loading && !error && pdfDoc != null);

  const syncUrl = useCallback((nextIndex: number) => {
    const params = new URLSearchParams(window.location.search);
    if (nextIndex <= KANTEI_PDF_COVER_INDEX) {
      params.delete("p");
    } else {
      params.set("p", String(nextIndex));
    }
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, []);

  const tryOpenFirstReadComplete = useCallback(
    (targetIndex: number) => {
      if (!restrictedFirstRead || firstReadCompleteOpen) return false;
      if (targetIndex > kanteiLifePathLastPdfIndex()) {
        setFirstReadCompleteOpen(true);
        return true;
      }
      return false;
    },
    [firstReadCompleteOpen, restrictedFirstRead],
  );

  const applyPageIndex = useCallback(
    (nextIndex: number) => {
      if (tryOpenFirstReadComplete(nextIndex)) return;

      const clamped = clampPdfIndex(nextIndex, pdfPageCount);
      setPdfIndex(clamped);
      syncUrl(clamped);
      try {
        sessionStorage.setItem(storageKey(orderId), String(clamped));
      } catch {
        // ignore
      }
    },
    [orderId, pdfPageCount, syncUrl, tryOpenFirstReadComplete],
  );

  const navigateTo = useCallback(
    async (nextIndex: number, destinationId?: string) => {
      const doc = pdfDocRef.current;
      if (!doc) return;
      let target = nextIndex;
      if (destinationId) {
        const resolved = await resolveKanteiPdfNamedDestination(doc, destinationId);
        if (resolved != null) target = resolved;
      }
      applyPageIndex(target);
    },
    [applyPageIndex],
  );

  const goDelta = useCallback(
    (delta: number) => {
      void navigateTo(pdfIndex + delta);
    },
    [navigateTo, pdfIndex],
  );

  useEffect(() => {
    const generation = loadGenerationRef.current + 1;
    loadGenerationRef.current = generation;
    let cancelled = false;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), PDF_FETCH_TIMEOUT_MS);

    async function load() {
      setLoading(true);
      setError(null);
      setLoadHint(null);
      setPdfDoc(null);
      pdfDocRef.current = null;

      const initialPageParam = new URLSearchParams(window.location.search).get("p");
      let initial = parsePdfPageSearchParam(initialPageParam, KANTEI_PDF_PHYSICAL_PAGE_COUNT);
      if (restrictedFirstRead) {
        initial = kanteiLifePathFirstPdfIndex();
      } else if (initial == null) {
        try {
          const stored = sessionStorage.getItem(storageKey(orderId));
          initial =
            stored != null
              ? parsePdfPageSearchParam(stored, KANTEI_PDF_PHYSICAL_PAGE_COUNT)
              : KANTEI_PDF_COVER_INDEX;
        } catch {
          initial = KANTEI_PDF_COVER_INDEX;
        }
      }
      const startIndex = initial ?? KANTEI_PDF_COVER_INDEX;

      try {
        const url = new URL(pdfPreviewHref, window.location.origin);
        url.searchParams.set("_cb", String(Date.now()));
        const res = await fetch(`${url.pathname}${url.search}`, {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });

        if (cancelled || generation !== loadGenerationRef.current) return;

        const contentType = res.headers.get("Content-Type") ?? "";
        if (!res.ok) {
          const text = await res.text();
          setError(parsePdfFetchError(res.status, contentType, text));
          return;
        }

        const ct = contentType.toLowerCase();
        if (!ct.includes("application/pdf") && !ct.includes("application/octet-stream")) {
          const text = await res.text();
          setError(parsePdfFetchError(res.status, contentType, text));
          return;
        }

        const blob = await res.blob();
        if (cancelled || generation !== loadGenerationRef.current) return;

        if (blob.size === 0) {
          setError("PDFが空でした。生成に失敗した可能性があります。");
          return;
        }

        const arrayBuffer = await blob.arrayBuffer();
        if (cancelled || generation !== loadGenerationRef.current) return;

        const doc = await openKanteiPdfDocument(arrayBuffer);
        if (cancelled || generation !== loadGenerationRef.current) {
          void doc.destroy();
          return;
        }

        pdfDocRef.current = doc;
        const pageCount = doc.numPages || KANTEI_PDF_PHYSICAL_PAGE_COUNT;
        const clamped = clampPdfIndex(startIndex, pageCount);
        setPdfPageCount(pageCount);
        setPdfDoc(doc);
        setPdfIndex(clamped);
        syncUrl(clamped);
        try {
          sessionStorage.setItem(storageKey(orderId), String(clamped));
        } catch {
          // ignore
        }
      } catch (e) {
        if (cancelled || generation !== loadGenerationRef.current) return;
        if (e instanceof Error && e.name === "AbortError") {
          setError(
            "PDFの準備がタイムアウトしました。生成に時間がかかっている可能性があります。しばらく待ってから再試行してください。",
          );
        } else {
          setError(e instanceof Error ? e.message : "PDFの読み込みに失敗しました。");
        }
      } finally {
        window.clearTimeout(timeoutId);
        if (!cancelled && generation === loadGenerationRef.current) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeoutId);
      if (pdfDocRef.current) {
        void pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }
    };
  }, [orderId, pdfPreviewHref, reloadKey, restrictedFirstRead, syncUrl]);

  useEffect(() => {
    if (!guideMode) return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has("guide")) return;
    params.delete("guide");
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [guideMode]);

  useEffect(() => {
    if (!loading || error) return;
    const hintTimer = window.setTimeout(() => {
      setLoadHint(PDF_LOADING_HINT);
    }, LOAD_HINT_MS);
    return () => window.clearTimeout(hintTimer);
  }, [error, loading]);

  useEffect(() => {
    if (!isCompact || !chromeVisible) return;
    const timer = window.setTimeout(() => setChromeVisible(false), 4000);
    return () => window.clearTimeout(timer);
  }, [chromeVisible, isCompact, pdfIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (tocOpen || loading || error) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goDelta(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goDelta(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [error, goDelta, loading, tocOpen]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    touchStartRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (loading || tocOpen || error || !pdfDoc || isPdfZoomedRef.current) return;
      const start = touchStartRef.current;
      if (!start || start.pointerId !== e.pointerId) return;
      touchStartRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }

      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      const isTap = Math.abs(dx) < 16 && Math.abs(dy) < 16;

      if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy) * 1.15) {
        if (isTap && isCompact) {
          setChromeVisible((v) => !v);
        }
        return;
      }

      didSwipeRef.current = true;
      if (dx < 0) goDelta(1);
      else goDelta(-1);
      window.setTimeout(() => {
        didSwipeRef.current = false;
      }, 300);
    },
    [error, goDelta, isCompact, loading, pdfDoc, tocOpen],
  );

  const onTouchStart = useCallback((e: React.TouchEvent<HTMLElement>) => {
    if (e.touches.length > 1 || isPdfZoomedRef.current) return;
    const t = e.touches[0];
    if (!t) return;
    touchStartRef.current = { x: t.clientX, y: t.clientY, pointerId: t.identifier };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLElement>) => {
      if (loading || tocOpen || error || !pdfDoc || isPdfZoomedRef.current) return;
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!start) return;
      const t = e.changedTouches[0];
      if (!t || t.identifier !== start.pointerId) return;
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      const isTap = Math.abs(dx) < 16 && Math.abs(dy) < 16;

      if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy) * 1.15) {
        if (isTap && isCompact) {
          setChromeVisible((v) => !v);
        }
        return;
      }

      didSwipeRef.current = true;
      if (dx < 0) goDelta(1);
      else goDelta(-1);
      window.setTimeout(() => {
        didSwipeRef.current = false;
      }, 300);
    },
    [error, goDelta, isCompact, loading, pdfDoc, tocOpen],
  );

  const pageIndicator = formatKanteiReaderPageIndicator(pdfIndex, pdfPageCount);
  const canGoPrev = pdfIndex > KANTEI_PDF_COVER_INDEX;
  const canGoNext = restrictedFirstRead
    ? pdfIndex >= kanteiLifePathFirstPdfIndex() && pdfIndex <= kanteiLifePathLastPdfIndex()
    : pdfIndex < pdfPageCount - 1;
  const showControls = !loading && !error && pdfDoc != null;

  const handleBackToBookshelf = useCallback(() => {
    router.replace(resolvedBackHref);
  }, [resolvedBackHref, router]);

  const compactBackControl = restrictedFirstRead ? (
    <button
      type="button"
      onClick={handleBackToBookshelf}
      className="pointer-events-auto shrink-0 rounded-lg bg-black/45 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/55"
    >
      {resolvedBackLabel}
    </button>
  ) : (
    <Link
      href={resolvedBackHref}
      className="pointer-events-auto shrink-0 rounded-lg bg-black/45 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm"
    >
      {resolvedBackLabel}
    </Link>
  );

  const desktopBackControl = restrictedFirstRead ? (
    <button
      type="button"
      onClick={handleBackToBookshelf}
      className="shrink-0 rounded-lg px-2 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100 hover:text-stone-900"
    >
      {resolvedBackLabel}
    </button>
  ) : (
    <Link
      href={resolvedBackHref}
      className="shrink-0 rounded-lg px-2 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100 hover:text-stone-900"
    >
      {resolvedBackLabel}
    </Link>
  );

  const compactShellStyle = useMemo(() => {
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

  const loadingOverlay = (
    <div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#faf8f5]/92 px-6 py-12 text-center backdrop-blur-[1px]"
      role="status"
      aria-live="polite"
    >
      <OwlSpinIndicator size="md" />
      <p className="text-sm font-medium text-stone-800">{PDF_LOADING_LABEL}</p>
      <p className="max-w-sm whitespace-pre-line text-xs leading-relaxed text-stone-600">
        {loadHint ?? PDF_LOADING_HINT}
      </p>
    </div>
  );

  const errorPanel = (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <p className="text-sm font-medium text-red-800" role="alert">
        {error}
      </p>
      <button
        type="button"
        onClick={() => setReloadKey((k) => k + 1)}
        className="rounded-lg bg-amber-800 px-4 py-2 text-sm font-medium text-white hover:bg-amber-900"
      >
        もう一度試す
      </button>
      <Link href={resolvedBackHref} className="text-sm text-stone-600 hover:text-stone-900">
        {resolvedBackLabelLong}
      </Link>
    </div>
  );

  const pageCanvas = pdfDoc ? (
    <KanteiPdfCanvasView
      pdfDoc={pdfDoc}
      pdfIndex={pdfIndex}
      fitMode="contain"
      className="h-full w-full"
      pinchZoom={isCompact}
      onZoomedChange={handlePdfZoomedChange}
    />
  ) : null;

  const navButtons = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={!canGoPrev}
        onClick={() => goDelta(-1)}
        className="min-h-[40px] flex-1 rounded-lg border border-stone-300 bg-white px-2 text-sm font-medium text-stone-800 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ← 前へ
      </button>
      <p className="w-[5.5rem] shrink-0 text-center text-xs tabular-nums text-stone-600">
        {pageIndicator}
      </p>
      <button
        type="button"
        disabled={!canGoNext}
        onClick={() => goDelta(1)}
        className="min-h-[40px] flex-1 rounded-lg border border-stone-300 bg-white px-2 text-sm font-medium text-stone-800 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        次へ →
      </button>
    </div>
  );

  if (isCompact) {
    return (
      <BodyPortal>
        <div
          className={`fixed overflow-hidden bg-[#faf8f5] ${IMMERSIVE_OVERLAY_Z_CLASS}`}
          style={compactShellStyle}
          role="dialog"
          aria-modal="true"
          aria-label="鑑定書ビューワー"
        >
          <div
            className="absolute inset-0 z-10 touch-none"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            role="presentation"
          >
            {pageCanvas}
          </div>

          {loading ? loadingOverlay : null}
          {error ? <div className="absolute inset-0 z-20 bg-[#faf8f5]">{errorPanel}</div> : null}

          {showControls ? (
            <>
              <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center gap-2 px-2 py-2 pt-[max(0.35rem,env(safe-area-inset-top))]">
                {compactBackControl}
                <p className="pointer-events-none min-w-0 flex-1 truncate text-center text-xs font-medium text-white drop-shadow-sm">
                  {title}
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTocOpen(true);
                  }}
                  className="pointer-events-auto shrink-0 rounded-lg bg-black/45 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm"
                >
                  目次
                </button>
              </div>

              <p
                className="pointer-events-none absolute left-1/2 top-[calc(max(0.35rem,env(safe-area-inset-top))+2.5rem)] z-30 -translate-x-1/2 rounded-lg bg-black/35 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm"
              >
                {pageIndicator}
              </p>

              <div
                className={[
                  "absolute inset-x-0 bottom-0 z-30 border-t border-stone-200/80 bg-[#faf8f5]/95 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-sm transition-opacity duration-200",
                  chromeVisible ? "opacity-100" : "pointer-events-none opacity-0",
                ].join(" ")}
              >
                <div className={chromeVisible ? "pointer-events-auto" : "pointer-events-none"}>
                  {navButtons}
                </div>
              </div>

              <p
                className={[
                  "pointer-events-none absolute inset-x-0 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-30 text-center text-[11px] text-stone-500 transition-opacity duration-200",
                  chromeVisible ? "opacity-0" : "opacity-80",
                ].join(" ")}
              >
                {COMPACT_READER_HINT}
              </p>
            </>
          ) : null}

          <KanteiPdfTocPanel
            open={tocOpen}
            currentPdfIndex={pdfIndex}
            onClose={() => setTocOpen(false)}
            onJump={(nextIndex, destinationId) => {
              void navigateTo(nextIndex, destinationId);
              setChromeVisible(false);
            }}
            restrictedFirstRead={restrictedFirstRead}
          />

          <KanteiFirstReadCompleteOverlay
            open={firstReadCompleteOpen}
            orderId={orderId}
            activeProfileId={activeProfileId}
            backHref={resolvedBackHref}
            onClose={() => setFirstReadCompleteOpen(false)}
          />
        </div>
        <LogHouseTourKanteiAssist />
      </BodyPortal>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-6rem)] flex-col">
      <header className="sticky top-0 z-20 -mx-4 border-b border-stone-200 bg-[#faf8f5]/95 px-4 py-2 backdrop-blur-sm sm:-mx-0 sm:rounded-t-xl sm:px-3">
        <div className="flex items-center gap-2">
          {desktopBackControl}
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-stone-900">{title}</p>
          <button
            type="button"
            onClick={() => setTocOpen(true)}
            disabled={loading || !!error || !pdfDoc}
            className="shrink-0 rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-xs font-medium text-amber-950 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            目次
          </button>
        </div>
      </header>

      <div
        className="relative flex min-h-0 flex-1 flex-col"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {error ? errorPanel : <div className="min-h-[calc(100dvh-14rem)] flex-1">{pageCanvas}</div>}

        {loading ? loadingOverlay : null}
      </div>

      {showControls ? (
        <footer className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 -mx-4 border-t border-stone-200 bg-[#faf8f5]/95 px-3 py-2 backdrop-blur-sm sm:-mx-0 sm:rounded-b-xl">
          {navButtons}
          <p className="mt-1.5 text-center text-[10px] text-stone-500">
            左右スワイプでもページをめくれます
          </p>
          <div className="mt-2 border-t border-stone-100 pt-2">
            <button
              type="button"
              onClick={() => setDownloadOpen((v) => !v)}
              className="w-full text-center text-xs text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline"
            >
              {downloadOpen ? "端末への保存を閉じる" : "PDFを端末に保存"}
            </button>
            {downloadOpen ? (
              <div className="mt-2 rounded-lg border border-amber-100 bg-amber-50/40 p-3">
                <PdfDownloadButton
                  href={pdfDownloadHref}
                  label="PDFをダウンロード"
                  className="inline-flex w-full justify-center rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-950 hover:bg-amber-50"
                  loadingLabel="初回は30秒〜数分かかることがあります。"
                  suggestedFileName={downloadFileName}
                />
                <p className="mt-2 text-[10px] leading-snug text-stone-500">
                  保存はダウンロード回数を1回消費します（プレビュー閲覧は消費しません）。
                </p>
              </div>
            ) : null}
          </div>
        </footer>
      ) : null}

      <KanteiPdfTocPanel
        open={tocOpen}
        currentPdfIndex={pdfIndex}
        onClose={() => setTocOpen(false)}
        onJump={(nextIndex, destinationId) => void navigateTo(nextIndex, destinationId)}
        restrictedFirstRead={restrictedFirstRead}
      />

      <KanteiFirstReadCompleteOverlay
        open={firstReadCompleteOpen}
        orderId={orderId}
        activeProfileId={activeProfileId}
        backHref={resolvedBackHref}
        onClose={() => setFirstReadCompleteOpen(false)}
      />
      <LogHouseTourKanteiAssist />
    </div>
  );
}
