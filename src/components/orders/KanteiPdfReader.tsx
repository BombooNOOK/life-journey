"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { KanteiPdfTocPanel } from "@/components/orders/KanteiPdfTocPanel";
import { PdfDownloadButton } from "@/components/orders/PdfDownloadButton";
import { OwlSpinIndicator } from "@/components/ui/OwlSpinIndicator";
import {
  buildKanteiPdfViewSrc,
  clampPdfIndex,
  formatKanteiReaderPageIndicator,
  KANTEI_PDF_COVER_INDEX,
  KANTEI_PDF_PHYSICAL_PAGE_COUNT,
  parsePdfPageSearchParam,
} from "@/lib/pdf/kanteiReaderPage";

const PDF_FETCH_TIMEOUT_MS = 310_000;
const LOAD_HINT_MS = 60_000;
const SWIPE_THRESHOLD_PX = 44;

type Props = {
  orderId: string;
  title: string;
  pdfPreviewHref: string;
  pdfDownloadHref: string;
  downloadFileName: string;
  backHref?: string;
};

function storageKey(orderId: string): string {
  return `kantei-read-page:${orderId}`;
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
}: Props) {
  const searchParams = useSearchParams();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const pdfBlobUrlRef = useRef<string | null>(null);
  const loadGenerationRef = useRef(0);

  const [reloadKey, setReloadKey] = useState(0);
  const [pdfIndex, setPdfIndex] = useState(KANTEI_PDF_COVER_INDEX);
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadHint, setLoadHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tocOpen, setTocOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);

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

  const applyView = useCallback(
    (blobUrl: string, nextIndex: number, destinationId?: string) => {
      const clamped = clampPdfIndex(nextIndex, KANTEI_PDF_PHYSICAL_PAGE_COUNT);
      setPdfIndex(clamped);
      setIframeSrc(buildKanteiPdfViewSrc(blobUrl, { pdfIndex: clamped, destinationId }));
      syncUrl(clamped);
      try {
        sessionStorage.setItem(storageKey(orderId), String(clamped));
      } catch {
        // ignore
      }
    },
    [orderId, syncUrl],
  );

  const navigateTo = useCallback(
    (nextIndex: number, destinationId?: string) => {
      const blobUrl = pdfBlobUrlRef.current;
      if (!blobUrl) return;
      applyView(blobUrl, nextIndex, destinationId);
    },
    [applyView],
  );

  const goDelta = useCallback(
    (delta: number) => {
      navigateTo(pdfIndex + delta);
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
      setIframeSrc(null);

      if (pdfBlobUrlRef.current) {
        URL.revokeObjectURL(pdfBlobUrlRef.current);
        pdfBlobUrlRef.current = null;
      }

      const initialPageParam = searchParams.get("p");
      let initial = parsePdfPageSearchParam(initialPageParam, KANTEI_PDF_PHYSICAL_PAGE_COUNT);
      if (initial == null) {
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

        const blobUrl = URL.createObjectURL(blob);
        pdfBlobUrlRef.current = blobUrl;
        applyView(blobUrl, startIndex);
        if (initialPageParam == null && startIndex > KANTEI_PDF_COVER_INDEX) {
          syncUrl(startIndex);
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
      if (pdfBlobUrlRef.current) {
        URL.revokeObjectURL(pdfBlobUrlRef.current);
        pdfBlobUrlRef.current = null;
      }
    };
  }, [applyView, orderId, pdfPreviewHref, reloadKey, searchParams, syncUrl]);

  useEffect(() => {
    if (!loading || error) return;
    const hintTimer = window.setTimeout(() => {
      setLoadHint("PDFの生成に時間がかかっています。初回は1分ほどかかることがあります。");
    }, LOAD_HINT_MS);
    return () => window.clearTimeout(hintTimer);
  }, [error, loading]);

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

  const onTouchStart = useCallback((e: React.TouchEvent<HTMLElement>) => {
    const t = e.touches[0];
    if (!t) return;
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLElement>) => {
      if (loading || tocOpen || error) return;
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!start) return;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy) * 1.15) return;
      if (dx < 0) goDelta(1);
      else goDelta(-1);
    },
    [error, goDelta, loading, tocOpen],
  );

  const pageIndicator = formatKanteiReaderPageIndicator(pdfIndex, KANTEI_PDF_PHYSICAL_PAGE_COUNT);
  const canGoPrev = pdfIndex > KANTEI_PDF_COVER_INDEX;
  const canGoNext = pdfIndex < KANTEI_PDF_PHYSICAL_PAGE_COUNT - 1;
  const showFooter = !loading && !error && iframeSrc != null;

  return (
    <div className="flex min-h-[calc(100dvh-6rem)] flex-col">
      <header className="sticky top-0 z-20 -mx-4 border-b border-stone-200 bg-[#faf8f5]/95 px-4 py-2 backdrop-blur-sm sm:-mx-0 sm:rounded-t-xl sm:px-3">
        <div className="flex items-center gap-2">
          <Link
            href={backHref}
            className="shrink-0 rounded-lg px-2 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100 hover:text-stone-900"
          >
            ← 本棚
          </Link>
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-stone-900">{title}</p>
          <button
            type="button"
            onClick={() => setTocOpen(true)}
            disabled={loading || !!error || !iframeSrc}
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
        {error ? (
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
            <Link href={backHref} className="text-sm text-stone-600 hover:text-stone-900">
              ← 本棚へ戻る
            </Link>
          </div>
        ) : iframeSrc ? (
          <iframe
            key={iframeSrc}
            title={`${title} PDF`}
            src={iframeSrc}
            className="min-h-[calc(100dvh-12rem)] w-full flex-1 border-0 bg-white"
          />
        ) : null}

        {loading ? (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#faf8f5]/92 px-6 py-12 text-center backdrop-blur-[1px]"
            role="status"
            aria-live="polite"
          >
            <OwlSpinIndicator size="md" />
            <p className="text-sm font-medium text-stone-800">鑑定書を準備しています…</p>
            <p className="max-w-sm text-xs leading-relaxed text-stone-600">
              {loadHint ??
                "初回は30秒〜1分ほどかかることがあります。フクロウが回っているあいだはそのままお待ちください。"}
            </p>
          </div>
        ) : null}
      </div>

      {showFooter ? (
        <footer className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 -mx-4 border-t border-stone-200 bg-[#faf8f5]/95 px-3 py-2 backdrop-blur-sm sm:-mx-0 sm:rounded-b-xl">
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
        onJump={(nextIndex, destinationId) => navigateTo(nextIndex, destinationId)}
      />
    </div>
  );
}
