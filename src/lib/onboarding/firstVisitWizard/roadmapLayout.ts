import type { CSSProperties } from "react";

/** 今日の道のり看板 PNG（576×1024） */
export const FIRST_VISIT_ROADMAP_DESIGN_SIZE = {
  widthPx: 576,
  heightPx: 1024,
} as const;

export type FirstVisitRoadmapTextPlacement = {
  /** 設計キャンバス上のテキスト領域左上 X */
  x: number;
  /** 設計キャンバス上のテキスト領域上端 Y */
  y: number;
  /** 羊皮紙の内側いっぱい（木枠にかからない範囲） */
  widthPx: number;
  heightPx: number;
  /** 領域上端からの余白（設計 px・表示時は scale 適用） */
  paddingTopPx?: number;
};

/** PC（lg 以上）：看板内の余白を多めに取った配置 */
export const FIRST_VISIT_ROADMAP_TEXT_PLACEMENT_DESKTOP: FirstVisitRoadmapTextPlacement = {
  x: 88,
  y: 158,
  widthPx: 400,
  heightPx: 560,
  paddingTopPx: 10,
};

/** スマホ：改行が起きにくいよう羊皮紙いっぱいに広げた配置 */
export const FIRST_VISIT_ROADMAP_TEXT_PLACEMENT_MOBILE: FirstVisitRoadmapTextPlacement = {
  x: 68,
  y: 154,
  widthPx: 440,
  heightPx: 592,
  paddingTopPx: 10,
};

export type FirstVisitRoadmapViewport = "desktop" | "mobile";

export function firstVisitRoadmapTextPlacement(
  viewport: FirstVisitRoadmapViewport,
): FirstVisitRoadmapTextPlacement {
  return viewport === "desktop"
    ? FIRST_VISIT_ROADMAP_TEXT_PLACEMENT_DESKTOP
    : FIRST_VISIT_ROADMAP_TEXT_PLACEMENT_MOBILE;
}

export function firstVisitRoadmapTextStyle(
  placement: FirstVisitRoadmapTextPlacement = FIRST_VISIT_ROADMAP_TEXT_PLACEMENT_MOBILE,
  scale = 1,
): CSSProperties {
  return {
    position: "absolute",
    left: placement.x * scale,
    top: placement.y * scale,
    width: placement.widthPx * scale,
    maxHeight: placement.heightPx * scale,
    overflow: "hidden",
  };
}
