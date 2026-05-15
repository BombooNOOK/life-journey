/**
 * 日記「製本イメージ」プレビュー用の幅ベース段階（small / medium / large）。
 * templateShellRef の実幅（px）で判定する。large は DiaryDesignPreview 内の既存「広い枠」式をそのまま使う。
 */

export const PREVIEW_SHELL_MAX_WIDTH_PX = 720 as const;

/** 未満なら small */
export const TIER_BREAKPOINT_MEDIUM_MIN_PX = 360 as const;
/** 未満なら medium、以上で large */
export const TIER_BREAKPOINT_LARGE_MIN_PX = 520 as const;

export type DiaryPreviewTier = "small" | "medium" | "large";

export function resolveDiaryPreviewTier(shellWidthPx: number): DiaryPreviewTier {
  if (shellWidthPx < TIER_BREAKPOINT_MEDIUM_MIN_PX) return "small";
  if (shellWidthPx < TIER_BREAKPOINT_LARGE_MIN_PX) return "medium";
  return "large";
}

export type DiaryPreviewScrollAffordance = {
  gradient: boolean;
  rail: boolean;
  chevron: boolean;
};

/** small / medium の本文エリア（large は 26% 固定で現行維持） */
export const DIARY_PREVIEW_TIER_BODY: Record<
  "small" | "medium",
  {
    maxHeightPct: string;
    scrollAffordance: DiaryPreviewScrollAffordance;
  }
> = {
  small: {
    maxHeightPct: "37%",
    scrollAffordance: { gradient: true, rail: true, chevron: true },
  },
  medium: {
    maxHeightPct: "33%",
    scrollAffordance: { gradient: true, rail: true, chevron: false },
  },
} as const;

/** large 時の本文 max-height（テンプレート高さに対する %） */
export const DIARY_PREVIEW_LARGE_BODY_MAX_HEIGHT_PCT = "26%" as const;

/** small / medium のフクロウ欄（高さ・フォント・本文背後の半透明面） */
export const DIARY_PREVIEW_TIER_COMMENT: Record<
  "small" | "medium",
  {
    maxHeightPct: string;
    fontSize: string;
    lineHeight: string;
    innerSurfaceClass: string;
  }
> = {
  small: {
    maxHeightPct: "21.5%",
    fontSize: "clamp(8px, min(1.88cqw, 2.48cqh), 10.5px)",
    lineHeight: "1.44",
    innerSurfaceClass:
      "rounded-md bg-[#faf7f0]/93 px-1.5 py-1 shadow-[0_1px_0_rgba(0,0,0,0.04)]",
  },
  medium: {
    maxHeightPct: "23%",
    fontSize: "clamp(9.5px, min(2.05cqw, 2.15cqh), 12px)",
    lineHeight: "1.36",
    innerSurfaceClass:
      "rounded-md bg-[#faf7f0]/90 px-1.5 py-0.5 shadow-[0_1px_0_rgba(0,0,0,0.03)]",
  },
} as const;

/** small / medium の日付行 */
export const DIARY_PREVIEW_TIER_DATE_ROW: Record<"small" | "medium", { fontSize: string }> = {
  small: {
    fontSize: "clamp(6px, min(1.16cqw, 1.66cqh), 8.2px)",
  },
  medium: {
    fontSize: "clamp(7.2px, min(1.3cqw, 1.82cqh), 10.5px)",
  },
} as const;

/** small / medium の丸印内数字・絵文字 */
export const DIARY_PREVIEW_TIER_NUMBER: Record<
  "small" | "medium",
  { fontSize: string; centerNudge: string }
> = {
  small: {
    fontSize: "clamp(7.2px, min(1.75cqw, 2.45cqh), 11px)",
    centerNudge: "translate(-50%, -50%) translate(-0.5px, -0.5px)",
  },
  medium: {
    fontSize: "clamp(9px, min(1.92cqw, 2.12cqh), 13px)",
    centerNudge: "translate(-50%, -50%) translate(-0.65px, -0.65px)",
  },
} as const;

/** large 時は極力従来の見た目に寄せた薄い生成り面（長文は内側スクロール） */
export const DIARY_PREVIEW_LARGE_COMMENT_INNER_SURFACE_CLASS =
  "rounded-sm bg-white/78 px-0.5 py-0.5";
