"use client";

import type { PDFDocumentProxy } from "pdfjs-dist";
import { useEffect, useRef } from "react";

import { usePinchZoomPan } from "@/hooks/usePinchZoomPan";

type Props = {
  pdfDoc: PDFDocumentProxy;
  pdfIndex: number;
  fitMode?: "width" | "contain";
  className?: string;
  pinchZoom?: boolean;
  onZoomedChange?: (zoomed: boolean) => void;
};

export function KanteiPdfCanvasView({
  pdfDoc,
  pdfIndex,
  fitMode = "contain",
  className,
  pinchZoom = false,
  onZoomedChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const pdfIndexRef = useRef(pdfIndex);
  const contentSizeRef = useRef({ width: 0, height: 0 });

  const { hostRef, scale, translate, isGesturing, resetZoom, setContentSize } = usePinchZoomPan({
    enabled: pinchZoom,
    onZoomedChange,
  });

  useEffect(() => {
    pdfIndexRef.current = pdfIndex;
    resetZoom();
  }, [pdfIndex, resetZoom]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let cancelled = false;
    let resizeTimer: number | null = null;

    async function renderPage() {
      const host = containerRef.current;
      const surface = canvasRef.current;
      if (!host || !surface) return;

      const renderIndex = pdfIndexRef.current;
      renderTaskRef.current?.cancel();
      renderTaskRef.current = null;

      try {
        const page = await pdfDoc.getPage(renderIndex + 1);
        if (cancelled || renderIndex !== pdfIndexRef.current) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const cw = host.clientWidth || baseViewport.width;
        const ch = host.clientHeight || baseViewport.height;
        const renderScale =
          fitMode === "width"
            ? cw / baseViewport.width
            : Math.min(cw / baseViewport.width, ch / baseViewport.height, 3);
        const viewport = page.getViewport({ scale: Math.max(renderScale, 0.1) });
        const ctx = surface.getContext("2d");
        if (!ctx || cancelled || renderIndex !== pdfIndexRef.current) return;

        const outputScale = window.devicePixelRatio || 1;
        const cssWidth = Math.floor(viewport.width);
        const cssHeight = Math.floor(viewport.height);
        surface.width = Math.floor(viewport.width * outputScale);
        surface.height = Math.floor(viewport.height * outputScale);
        surface.style.width = `${cssWidth}px`;
        surface.style.height = `${cssHeight}px`;
        ctx.setTransform(outputScale, 0, 0, outputScale, 0, 0);

        contentSizeRef.current = { width: cssWidth, height: cssHeight };
        setContentSize(cssWidth, cssHeight);

        const task = page.render({ canvasContext: ctx, viewport });
        renderTaskRef.current = task;
        await task.promise;
      } catch {
        // cancelled render tasks throw; ignore
      }
    }

    void renderPage();

    const ro = new ResizeObserver(() => {
      if (resizeTimer != null) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        void renderPage();
      }, 80);
    });
    ro.observe(container);

    return () => {
      cancelled = true;
      if (resizeTimer != null) window.clearTimeout(resizeTimer);
      renderTaskRef.current?.cancel();
      ro.disconnect();
    };
  }, [fitMode, pdfDoc, pdfIndex, setContentSize]);

  const setHostRef = (node: HTMLDivElement | null) => {
    hostRef.current = node;
    containerRef.current = node;
  };

  return (
    <div
      ref={setHostRef}
      className={["h-full w-full overflow-hidden", pinchZoom ? "touch-none" : "", className]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className="flex h-full w-full items-center justify-center"
        style={{
          transform: pinchZoom
            ? `translate3d(${translate.x}px, ${translate.y}px, 0) scale(${scale})`
            : undefined,
          transformOrigin: "center center",
          transition: pinchZoom && !isGesturing ? "transform 0.15s ease-out" : undefined,
        }}
      >
        <canvas ref={canvasRef} className="max-h-full max-w-full" />
      </div>
    </div>
  );
}
