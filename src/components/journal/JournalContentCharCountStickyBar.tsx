"use client";

import type { CSSProperties, Ref } from "react";

import {
  CONTENT_FONT_MODE_LABELS_JA,
  type ContentFontMode,
} from "@/lib/journal/contentFontMode";
import { getBodyFrameStatusLabel } from "@/lib/journal/diaryPreviewBodyLineLimits";

type Props = {
  contentFontMode: ContentFontMode;
  charCount: number;
  charMax: number;
  bodyLineCount: number;
  bodyMaxLines: number;
  bodyOverflows: boolean;
  commentOverflows: boolean;
  /** キーボード直上に固定するときの座標（visualViewport 基準） */
  docked?: boolean;
  dockedStyle?: CSSProperties;
  rootRef?: Ref<HTMLDivElement>;
  className?: string;
};

function CounterContent({
  contentFontMode,
  charCount,
  charMax,
  bodyLineCount,
  bodyMaxLines,
  bodyOverflows,
  commentOverflows,
}: Omit<Props, "docked" | "dockedStyle" | "rootRef" | "className">) {
  const frameOverflows = bodyOverflows || commentOverflows;
  const frameLabel = getBodyFrameStatusLabel(
    contentFontMode,
    bodyOverflows,
    commentOverflows,
  );
  const modeLabel = CONTENT_FONT_MODE_LABELS_JA[contentFontMode];

  return (
    <>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <span className="text-sm font-semibold tabular-nums text-stone-900">
          {modeLabel}：{charCount}/{charMax}文字
        </span>
        <span className="text-sm font-semibold tabular-nums text-stone-800">
          本文行数：{bodyLineCount}/{bodyMaxLines}行
        </span>
      </div>
      <p
        className={
          frameOverflows
            ? "mt-0.5 text-xs font-medium leading-snug text-amber-800"
            : "mt-0.5 text-xs leading-snug text-stone-500"
        }
      >
        {frameLabel}
      </p>
    </>
  );
}

const shellClass =
  "border-stone-200/90 bg-[#faf8f5]/97 shadow-[0_-1px_0_rgba(0,0,0,0.06)] backdrop-blur-sm";

/** 同一 DOM で通常表示 ↔ キーボード直上固定を切り替え（再マウントによる揺れを抑える） */
export function JournalContentCharCountStickyBar({
  docked = false,
  dockedStyle,
  rootRef,
  className = "",
  ...stats
}: Props) {
  return (
    <div
      ref={rootRef}
      className={[
        docked
          ? `fixed z-[60] border-t ${shellClass}`
          : `mt-2 rounded-lg border ${shellClass} px-2 py-2`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={docked ? dockedStyle : undefined}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className={docked ? "mx-auto max-w-3xl px-4 py-2" : undefined}>
        <CounterContent {...stats} />
      </div>
    </div>
  );
}
