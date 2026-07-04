import type { CSSProperties } from "react";

import type { ObjectCoverLayout } from "@/lib/home/homeForestSignLayout";

import {
  FIRST_VISIT_WELCOME_BG_INTRINSIC,
  type FirstVisitWelcomeViewport,
} from "./welcomeAssets";

export type FirstVisitWelcomeTextPlacement = {
  /** 設計キャンバス上の中心 X */
  x: number;
  /** 設計キャンバス上の中心 Y */
  y: number;
  /** テキスト領域の幅（看板の内側・フクロウと重ならない範囲） */
  widthPx: number;
  /** テキスト領域の高さ */
  heightPx: number;
  /** 領域上端からの余白（設計 px） */
  paddingTopPx?: number;
  /** 見出しと本文の間（設計 px） */
  headingBodyGapPx?: number;
  /** 段落と段落の間（設計 px） */
  paragraphGapPx?: number;
  /** 空白行の高さ（本文1行に対する比率。1未満で空白だけ詰まる） */
  blankLineHeightRatio?: number;
  /** 設計時の見出し font-size */
  headingFontSize: number;
  /** 設計時の本文 font-size */
  bodyFontSize: number;
  lineHeight?: number;
};

/** 看板テキストの配置（Canva 看板の内側に合わせて微調整。y を大きくすると下へ） */
export const FIRST_VISIT_WELCOME_MESSAGE_TEXT: Record<
  FirstVisitWelcomeViewport,
  FirstVisitWelcomeTextPlacement
> = {
  mobile: {
    x: 280,
    y: 878,
    widthPx: 416,
    heightPx: 172,
    paddingTopPx: 4,
    headingBodyGapPx: 2,
    paragraphGapPx: 1,
    blankLineHeightRatio: 0.5,
    headingFontSize: 21,
    bodyFontSize: 17,
    lineHeight: 1.3,
  },
  desktop: {
    x: 520,
    y: 378,
    widthPx: 430,
    heightPx: 128,
    paddingTopPx: 8,
    headingBodyGapPx: 4,
    paragraphGapPx: 4,
    headingFontSize: 16,
    bodyFontSize: 12.5,
    lineHeight: 1.46,
  },
};

export function firstVisitWelcomeMessageTextPlacement(
  viewport: FirstVisitWelcomeViewport,
): FirstVisitWelcomeTextPlacement {
  return FIRST_VISIT_WELCOME_MESSAGE_TEXT[viewport];
}

export function firstVisitWelcomeContainLayout(
  containerWidth: number,
  containerHeight: number,
  viewport: FirstVisitWelcomeViewport,
): ObjectCoverLayout {
  const { widthPx, heightPx } = FIRST_VISIT_WELCOME_BG_INTRINSIC[viewport];
  const scale = Math.min(containerWidth / widthPx, containerHeight / heightPx);
  const displayedWidth = widthPx * scale;
  const displayedHeight = heightPx * scale;
  const offsetX = (containerWidth - displayedWidth) / 2;
  const offsetY = (containerHeight - displayedHeight) / 2;

  return {
    scale,
    offsetX,
    offsetY,
    containerWidth,
    containerHeight,
  };
}

/** 背景の fit とテキスト座標を揃える（モバイル=cover、PC=contain） */
export function firstVisitWelcomeStageLayout(
  containerWidth: number,
  containerHeight: number,
  viewport: FirstVisitWelcomeViewport,
  objectPosition: { xPercent: number; yPercent: number },
): ObjectCoverLayout {
  if (viewport === "mobile") {
    return firstVisitWelcomeCoverLayout(
      containerWidth,
      containerHeight,
      viewport,
      objectPosition,
    );
  }
  return firstVisitWelcomeContainLayout(containerWidth, containerHeight, viewport);
}

export function firstVisitWelcomeCoverLayout(
  containerWidth: number,
  containerHeight: number,
  viewport: FirstVisitWelcomeViewport,
  objectPosition: { xPercent: number; yPercent: number },
): ObjectCoverLayout {
  const { widthPx, heightPx } = FIRST_VISIT_WELCOME_BG_INTRINSIC[viewport];
  const scale = Math.max(containerWidth / widthPx, containerHeight / heightPx);
  const displayedWidth = widthPx * scale;
  const displayedHeight = heightPx * scale;
  const offsetX = (containerWidth - displayedWidth) * (objectPosition.xPercent / 100);
  const offsetY = (containerHeight - displayedHeight) * (objectPosition.yPercent / 100);

  return {
    scale,
    offsetX,
    offsetY,
    containerWidth,
    containerHeight,
  };
}

export function firstVisitWelcomeMessageTextStyle(
  placement: FirstVisitWelcomeTextPlacement,
  coverLayout: ObjectCoverLayout | null,
): CSSProperties {
  if (!coverLayout) {
    const { widthPx: designW, heightPx: designH } = FIRST_VISIT_WELCOME_BG_INTRINSIC.mobile;
    return {
      position: "absolute",
      left: `${(placement.x / designW) * 100}%`,
      top: `${((placement.y - placement.heightPx / 2) / designH) * 100}%`,
      width: `${(placement.widthPx / designW) * 100}%`,
      transform: "translateX(-50%)",
    };
  }

  const w = placement.widthPx * coverLayout.scale;
  const x = coverLayout.offsetX + placement.x * coverLayout.scale;
  const top =
    coverLayout.offsetY + (placement.y - placement.heightPx / 2) * coverLayout.scale;

  return {
    position: "absolute",
    left: `${x}px`,
    top: `${top}px`,
    width: `${w}px`,
    transform: "translateX(-50%)",
  };
}

export function firstVisitWelcomeMessageTypography(
  placement: FirstVisitWelcomeTextPlacement,
  coverLayout: ObjectCoverLayout | null,
): { headingPx: number; bodyPx: number; lineHeight: number } {
  const scale = coverLayout?.scale ?? 1;
  return {
    headingPx: placement.headingFontSize * scale,
    bodyPx: placement.bodyFontSize * scale,
    lineHeight: placement.lineHeight ?? 1.55,
  };
}

/** 本文1行分の高さ（空白行の目安・設計 px） */
export function firstVisitWelcomeBlankLineGapPx(placement: FirstVisitWelcomeTextPlacement): number {
  const ratio = placement.blankLineHeightRatio ?? 1;
  return placement.bodyFontSize * (placement.lineHeight ?? 1.32) * ratio;
}

export function objectPositionCss(objectPosition: { xPercent: number; yPercent: number }): string {
  return `${objectPosition.xPercent}% ${objectPosition.yPercent}%`;
}
