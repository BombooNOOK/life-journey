"use client";

import type { PDFDocumentProxy } from "pdfjs-dist";
import { useEffect, useRef } from "react";

type Props = {
  pdfDoc: PDFDocumentProxy;
  pdfIndex: number;
  fitMode?: "width" | "contain";
  className?: string;
};

export function KanteiPdfCanvasView({
  pdfDoc,
  pdfIndex,
  fitMode = "contain",
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const pdfIndexRef = useRef(pdfIndex);

  useEffect(() => {
    pdfIndexRef.current = pdfIndex;
  }, [pdfIndex]);

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
        const scale =
          fitMode === "width"
            ? cw / baseViewport.width
            : Math.min(cw / baseViewport.width, ch / baseViewport.height, 3);
        const viewport = page.getViewport({ scale: Math.max(scale, 0.1) });
        const ctx = surface.getContext("2d");
        if (!ctx || cancelled || renderIndex !== pdfIndexRef.current) return;

        const outputScale = window.devicePixelRatio || 1;
        surface.width = Math.floor(viewport.width * outputScale);
        surface.height = Math.floor(viewport.height * outputScale);
        surface.style.width = `${Math.floor(viewport.width)}px`;
        surface.style.height = `${Math.floor(viewport.height)}px`;
        ctx.setTransform(outputScale, 0, 0, outputScale, 0, 0);

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
  }, [fitMode, pdfDoc, pdfIndex]);

  return (
    <div
      ref={containerRef}
      className={["flex h-full w-full items-center justify-center", className]
        .filter(Boolean)
        .join(" ")}
    >
      <canvas ref={canvasRef} className="max-h-full max-w-full" />
    </div>
  );
}
