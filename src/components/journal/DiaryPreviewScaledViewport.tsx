"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { DIARY_PREVIEW_FRAME_SHELL_CLASS } from "@/lib/journal/diaryPreviewFrameDisplay";
import {
  DIARY_PREVIEW_PAGE_HEIGHT,
  DIARY_PREVIEW_PAGE_WIDTH,
  DIARY_PREVIEW_SAFE_SCALE_CONTAIN,
  DIARY_PREVIEW_SAFE_SCALE_WIDTH,
} from "@/lib/journal/diaryPreviewFixedLayout";

const HOST_FRAME_PADDING_PX = 12;

/** スマホ全画面用（diaryPreviewFixedLayout の scale 係数とは別） */
const FULLSCREEN_HOST_PADDING_PX = 0;
/** 横幅基準 scale の安全係数（高さには合わせない） */
const FULLSCREEN_SAFE_FACTOR = 0.995;
/** 日記ブック全画面：最小余白・縦横フィット最大化 */
const BOOK_MAXIMIZE_PADDING_PX = 4;
const BOOK_MAXIMIZE_SAFE_FACTOR = 0.98;

export type DiaryPreviewScaleFitMode = "width" | "contain" | "fullscreen" | "maximize";

type Props = {
  children: ReactNode;
  className?: string;
  fitMode?: DiaryPreviewScaleFitMode;
  /** 親の背景タップ閉じる用：ページ本体クリックを親へ伝播させない */
  isolatePointerEvents?: boolean;
};

/**
 * 724×1024 固定ページを transform: scale() のみで表示。
 * 金枠欠け対策は scale 係数ではなく frame-shell の overflow 制御で行う。
 */
export function DiaryPreviewScaledViewport({
  children,
  className = "",
  fitMode = "width",
  isolatePointerEvents = false,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.45);

  const safeFactor =
    fitMode === "contain"
      ? DIARY_PREVIEW_SAFE_SCALE_CONTAIN
      : fitMode === "maximize"
        ? BOOK_MAXIMIZE_SAFE_FACTOR
        : DIARY_PREVIEW_SAFE_SCALE_WIDTH;
  const hostPaddingPx =
    fitMode === "fullscreen"
      ? FULLSCREEN_HOST_PADDING_PX
      : fitMode === "maximize"
        ? BOOK_MAXIMIZE_PADDING_PX
        : HOST_FRAME_PADDING_PX;

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const fit = () => {
      const pad = hostPaddingPx * 2;
      const availW = Math.max(0, el.clientWidth - pad);
      if (availW <= 0) return;

      const byWidth = availW / DIARY_PREVIEW_PAGE_WIDTH;

      if (fitMode === "fullscreen") {
        setScale(
          Math.min(1, Math.max(0.05, byWidth * FULLSCREEN_SAFE_FACTOR)),
        );
        return;
      }

      let factor = byWidth;

      if (fitMode === "contain" || fitMode === "maximize") {
        const availH = Math.max(0, el.clientHeight - pad);
        if (availH > 0) {
          const byHeight = availH / DIARY_PREVIEW_PAGE_HEIGHT;
          factor = Math.min(byWidth, byHeight);
        }
      }

      setScale(Math.min(1, Math.max(0.05, factor * safeFactor)));
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", fit);
    vv?.addEventListener("scroll", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", fit);
      vv?.removeEventListener("resize", fit);
      vv?.removeEventListener("scroll", fit);
    };
  }, [fitMode, hostPaddingPx, safeFactor]);

  const scaledW = Math.round(DIARY_PREVIEW_PAGE_WIDTH * scale);
  const scaledH = Math.round(DIARY_PREVIEW_PAGE_HEIGHT * scale);
  const isFullscreenWidthFit = fitMode === "fullscreen";
  const isMaximizeFit = fitMode === "maximize";

  return (
    <div
      ref={hostRef}
      className={[
        "flex size-full justify-center",
        isFullscreenWidthFit
          ? "items-start overflow-x-hidden overflow-y-visible"
          : "items-center overflow-visible",
        isMaximizeFit ? "min-h-0" : "",
        className,
      ]
        .join(" ")
        .trim()}
      style={{
        padding: hostPaddingPx,
        boxSizing: "border-box",
      }}
    >
      {/* 枠専用シェル: overflow:hidden をやめ、スケール後の描画が下端で切れないようにする */}
      <div
        className={`relative shrink-0 overflow-visible ${DIARY_PREVIEW_FRAME_SHELL_CLASS}`}
        style={{ width: scaledW, height: scaledH }}
        onClick={isolatePointerEvents ? (e) => e.stopPropagation() : undefined}
        onKeyDown={isolatePointerEvents ? (e) => e.stopPropagation() : undefined}
        role={isolatePointerEvents ? "presentation" : undefined}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: DIARY_PREVIEW_PAGE_WIDTH,
            height: DIARY_PREVIEW_PAGE_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: "0 0",
            WebkitTransform: `scale(${scale}) translateZ(0)`,
            willChange: "transform",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
