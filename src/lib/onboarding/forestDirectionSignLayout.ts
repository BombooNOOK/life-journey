import type { CSSProperties } from "react";

import { DIARY_PREVIEW_LABEL_FONT_FAMILY } from "@/lib/journal/diaryBookEntryLabelFont";

export type ForestDirectionSignFacing = "left" | "right";

/** 一本矢印の森の看板 PNG（1024×1024） */
export const FOREST_DIRECTION_SIGN_SRC_BY_FACING = {
  left: "/decorations/forest-direction-sign-left.png",
  right: "/decorations/forest-direction-sign-right.png",
} as const satisfies Record<ForestDirectionSignFacing, string>;

/** 既定（鑑定のへや案内など） */
export const FOREST_DIRECTION_SIGN_SRC = FOREST_DIRECTION_SIGN_SRC_BY_FACING.right;

export function forestDirectionSignSrcForFacing(facing: ForestDirectionSignFacing): string {
  return FOREST_DIRECTION_SIGN_SRC_BY_FACING[facing];
}

export const FOREST_DIRECTION_SIGN_DESIGN_SIZE = {
  widthPx: 1024,
  heightPx: 1024,
} as const;

/** 看板板面：日記ブック見出しと同じ手書き風 Klee One */
export const FOREST_DIRECTION_SIGN_LABEL_FONT_FAMILY = DIARY_PREVIEW_LABEL_FONT_FAMILY;

/** 看板板面の行き先名（茶系・森の案内板と同系色） */
export const FOREST_DIRECTION_SIGN_LABEL_COLOR = "#735a48" as const;

export type ForestDirectionSignTextAnchor = "topleft" | "center";

export type ForestDirectionSignLabelPlacement = {
  /** 1024 設計座標（textAnchor に応じた基準点） */
  x: number;
  y: number;
  fontSize: number;
  fontWeight?: 400 | 600 | 700;
  lineHeight?: number;
  maxWidth?: number;
  /** topleft: (x,y)=文字ボックス左上＝「鑑」の左上 / center: 文字ブロック中心 */
  textAnchor?: ForestDirectionSignTextAnchor;
  textAlign?: "left" | "center" | "right";
  /** 基準点（textAnchor）を中心に回転（度） */
  rotate?: number;
  color?: string;
};

/** 1024×1024 設計座標。`/preview/forest-direction-sign/layout` で微調整 */
export const FOREST_DIRECTION_SIGN_LABEL_PLACEMENT_BY_FACING: Record<
  ForestDirectionSignFacing,
  ForestDirectionSignLabelPlacement
> = {
  right: {
    x: 294,
    y: 284,
    textAnchor: "topleft",
    textAlign: "left",
    fontSize: 88,
    fontWeight: 400,
    lineHeight: 1,
    maxWidth: 360,
    rotate: -3,
    color: FOREST_DIRECTION_SIGN_LABEL_COLOR,
  },
  left: {
    x: 294,
    y: 284,
    textAnchor: "topleft",
    textAlign: "left",
    fontSize: 88,
    fontWeight: 400,
    lineHeight: 1,
    maxWidth: 360,
    rotate: -3,
    color: FOREST_DIRECTION_SIGN_LABEL_COLOR,
  },
};

/** @deprecated facing 指定なしの互換用（右向き） */
export const FOREST_DIRECTION_SIGN_LABEL_PLACEMENT =
  FOREST_DIRECTION_SIGN_LABEL_PLACEMENT_BY_FACING.right;

export function forestDirectionSignLabelPlacementForFacing(
  facing: ForestDirectionSignFacing,
): ForestDirectionSignLabelPlacement {
  return FOREST_DIRECTION_SIGN_LABEL_PLACEMENT_BY_FACING[facing];
}

/**
 * 看板ラベル style。scale = 表示幅 / 1024。
 * topleft なら (x,y) が「鑑」の左上に来る。
 */
export function forestDirectionSignLabelStyle(
  placement: ForestDirectionSignLabelPlacement = FOREST_DIRECTION_SIGN_LABEL_PLACEMENT,
  scale = 1,
): CSSProperties {
  const anchor = placement.textAnchor ?? "topleft";
  const transforms: string[] = [];

  if (anchor === "center") {
    transforms.push("translate(-50%, -50%)");
  }
  if (placement.rotate) {
    transforms.push(`rotate(${placement.rotate}deg)`);
  }

  return {
    position: "absolute",
    left: placement.x * scale,
    top: placement.y * scale,
    maxWidth: placement.maxWidth != null ? placement.maxWidth * scale : undefined,
    /** 看板の表示幅に比例（1024 設計座標基準） */
    fontSize: placement.fontSize * scale,
    fontFamily: FOREST_DIRECTION_SIGN_LABEL_FONT_FAMILY,
    fontWeight: placement.fontWeight ?? 400,
    lineHeight: placement.lineHeight ?? 1,
    color: placement.color ?? FOREST_DIRECTION_SIGN_LABEL_COLOR,
    textAlign: placement.textAlign ?? (anchor === "center" ? "center" : "left"),
    transform: transforms.length > 0 ? transforms.join(" ") : undefined,
    transformOrigin: anchor === "center" ? "center center" : "left top",
  };
}
