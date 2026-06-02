"use client";

import type { ReactNode } from "react";

import {
  DiaryPreviewScaledViewport,
  type DiaryPreviewScaleFitMode,
} from "@/components/journal/DiaryPreviewScaledViewport";

type Props = {
  children: ReactNode;
  /** ページ枠の下（編集リンク等） */
  footer?: ReactNode;
  fitMode?: DiaryPreviewScaleFitMode;
  /** 全画面ビューワーなど、親の高さいっぱいにフィットさせる */
  fillHeight?: boolean;
  /** 全画面時など、ページを親の中央に配置 */
  centered?: boolean;
  className?: string;
};

/**
 * 日記ブック読書用の共通ページ枠（724×1024 を同一 scale で表示）。
 */
export function DiaryBookPageViewport({
  children,
  footer,
  fitMode = "width",
  fillHeight = false,
  centered = false,
  className = "",
}: Props) {
  const isMaximize = fitMode === "maximize";

  const frameClass = fillHeight
    ? centered || isMaximize
      ? "flex h-full min-h-0 w-full flex-1 items-center justify-center"
      : "relative min-h-0 w-full flex-1"
    : "relative aspect-[724/1024] w-full";

  const scaledHostClass =
    centered || isMaximize
      ? "flex h-full min-h-0 w-full items-center justify-center"
      : "absolute inset-0 size-full";

  return (
    <div
      className={[
        fillHeight
          ? isMaximize || centered
            ? "flex h-full min-h-0 w-full max-w-none flex-col items-center justify-center"
            : "flex h-full min-h-0 w-full flex-col"
          : "mx-auto w-full max-w-[540px]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* 724×1024 の枠を先に確保（contain だと高さ0の親で極小 scale になる） */}
      <div className={frameClass}>
        <DiaryPreviewScaledViewport fitMode={fitMode} className={scaledHostClass}>
          {children}
        </DiaryPreviewScaledViewport>
      </div>
      {footer ? <div className="mt-2 min-h-[1.75rem] shrink-0 text-center">{footer}</div> : null}
    </div>
  );
}
