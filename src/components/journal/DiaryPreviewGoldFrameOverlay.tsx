"use client";

import {
  DIARY_PREVIEW_GOLD_FRAME_INNER_COLOR,
  DIARY_PREVIEW_GOLD_FRAME_INNER_INSET_PX,
  DIARY_PREVIEW_GOLD_FRAME_INNER_STROKE_PX,
  DIARY_PREVIEW_GOLD_FRAME_MASK_THICKNESS_PX,
  DIARY_PREVIEW_GOLD_FRAME_OUTER_COLOR,
  DIARY_PREVIEW_GOLD_FRAME_OUTER_INSET_PX,
  DIARY_PREVIEW_GOLD_FRAME_OUTER_STROKE_PX,
  DIARY_PREVIEW_GOLD_FRAME_PAGE_BG,
  DIARY_PREVIEW_GOLD_FRAME_PAGE_HEIGHT,
  DIARY_PREVIEW_GOLD_FRAME_PAGE_WIDTH,
  DIARY_PREVIEW_GOLD_FRAME_RADIUS_PX,
} from "@/lib/journal/diaryPreviewGoldFrame";

const W = DIARY_PREVIEW_GOLD_FRAME_PAGE_WIDTH;
const H = DIARY_PREVIEW_GOLD_FRAME_PAGE_HEIGHT;
const MASK = DIARY_PREVIEW_GOLD_FRAME_MASK_THICKNESS_PX;

/**
 * 背景 PNG の外周金枠をマスクし、SVG で金枠のみを描画する（724×1024 固定）。
 * オーバーレイ本文・数字の座標には影響しない。
 */
export function DiaryPreviewGoldFrameOverlay() {
  const outer = DIARY_PREVIEW_GOLD_FRAME_OUTER_INSET_PX;
  const inner = DIARY_PREVIEW_GOLD_FRAME_INNER_INSET_PX;
  const r = DIARY_PREVIEW_GOLD_FRAME_RADIUS_PX;

  return (
    <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
      {/* PNG 内の外周金枠を地色で覆い、CSS/SVG 枠との二重線を防ぐ */}
      <div
        className="absolute left-0 right-0 top-0"
        style={{ height: MASK, backgroundColor: DIARY_PREVIEW_GOLD_FRAME_PAGE_BG }}
      />
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{ height: MASK, backgroundColor: DIARY_PREVIEW_GOLD_FRAME_PAGE_BG }}
      />
      <div
        className="absolute bottom-0 left-0 top-0"
        style={{ width: MASK, backgroundColor: DIARY_PREVIEW_GOLD_FRAME_PAGE_BG }}
      />
      <div
        className="absolute bottom-0 right-0 top-0"
        style={{ width: MASK, backgroundColor: DIARY_PREVIEW_GOLD_FRAME_PAGE_BG }}
      />

      <svg
        className="absolute inset-0 block"
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        preserveAspectRatio="none"
      >
        <rect
          x={outer}
          y={outer}
          width={W - outer * 2}
          height={H - outer * 2}
          rx={r}
          ry={r}
          fill="none"
          stroke={DIARY_PREVIEW_GOLD_FRAME_OUTER_COLOR}
          strokeWidth={DIARY_PREVIEW_GOLD_FRAME_OUTER_STROKE_PX}
        />
        <rect
          x={inner}
          y={inner}
          width={W - inner * 2}
          height={H - inner * 2}
          rx={r}
          ry={r}
          fill="none"
          stroke={DIARY_PREVIEW_GOLD_FRAME_INNER_COLOR}
          strokeWidth={DIARY_PREVIEW_GOLD_FRAME_INNER_STROKE_PX}
        />
      </svg>
    </div>
  );
}
