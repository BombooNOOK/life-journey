import type { CSSProperties } from "react";

import { DIARY_PREVIEW_LABEL_FONT_FAMILY } from "@/lib/journal/diaryBookEntryLabelFont";

/**
 * フクロウ先生コメント枠 PNG（480×480）
 * 配置: public/decorations/first-visit-resident-registration-owl-frame.png
 */
export const FIRST_VISIT_RESIDENT_REGISTRATION_OWL_FRAME_SRC =
  "/decorations/first-visit-resident-registration-owl-frame.png" as const;

export const FIRST_VISIT_RESIDENT_REGISTRATION_OWL_FRAME_DESIGN_SIZE = {
  widthPx: 480,
  heightPx: 480,
} as const;

export const FIRST_VISIT_RESIDENT_REGISTRATION_OWL_FRAME_LABEL_FONT_FAMILY =
  DIARY_PREVIEW_LABEL_FONT_FAMILY;

export const FIRST_VISIT_RESIDENT_REGISTRATION_OWL_FRAME_LABEL_COLOR = "#5c4a3a" as const;

export type FirstVisitOwlFrameTextAnchor = "topleft" | "center";

export type FirstVisitOwlFrameLabelPlacement = {
  x: number;
  y: number;
  fontSize: number;
  fontWeight?: 400 | 600 | 700;
  lineHeight?: number;
  textAnchor?: FirstVisitOwlFrameTextAnchor;
  textAlign?: "left" | "center" | "right";
  color?: string;
};

/** 480×480 設計座標。`/preview/first-visit-owl-frame/layout` で微調整 */
export const FIRST_VISIT_RESIDENT_REGISTRATION_OWL_FRAME_LABEL_PLACEMENT: FirstVisitOwlFrameLabelPlacement =
  {
    x: 240,
    y: 187,
    textAnchor: "center",
    textAlign: "left",
    fontSize: 22,
    fontWeight: 600,
    lineHeight: 1.55,
    color: FIRST_VISIT_RESIDENT_REGISTRATION_OWL_FRAME_LABEL_COLOR,
  };

export function firstVisitOwlFrameLabelStyle(
  placement: FirstVisitOwlFrameLabelPlacement = FIRST_VISIT_RESIDENT_REGISTRATION_OWL_FRAME_LABEL_PLACEMENT,
  scale = 1,
): CSSProperties {
  const anchor = placement.textAnchor ?? "topleft";
  const transforms: string[] = [];

  if (anchor === "center") {
    transforms.push("translate(-50%, -50%)");
  }

  return {
    position: "absolute",
    left: placement.x * scale,
    top: placement.y * scale,
    fontSize: placement.fontSize * scale,
    fontFamily: FIRST_VISIT_RESIDENT_REGISTRATION_OWL_FRAME_LABEL_FONT_FAMILY,
    fontWeight: placement.fontWeight ?? 400,
    lineHeight: placement.lineHeight ?? 1.55,
    color: placement.color ?? FIRST_VISIT_RESIDENT_REGISTRATION_OWL_FRAME_LABEL_COLOR,
    textAlign: placement.textAlign ?? "left",
    transform: transforms.length > 0 ? transforms.join(" ") : undefined,
    transformOrigin: anchor === "center" ? "center center" : "left top",
    /** 改行は本文の \n のみ。自動折り返しなし */
    whiteSpace: "pre",
  };
}
