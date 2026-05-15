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

/** 紙面上の固定表示枠（% 座標はテンプレート画像基準） */
export type DiaryPreviewRegionBox = {
  left: string;
  top: string;
  width: string;
  heightPct: string;
};

/** large：本文・コメント枠（従来レイアウト） */
export const DIARY_PREVIEW_LARGE_BODY_REGION: DiaryPreviewRegionBox = {
  left: "13.2%",
  top: "55%",
  width: "72.8%",
  heightPct: "26%",
};

export const DIARY_PREVIEW_LARGE_COMMENT_REGION: DiaryPreviewRegionBox = {
  left: "9.15%",
  top: "79.2%",
  width: "62.2%",
  heightPct: "24%",
};

/** コメント左端（テンプレ共通） */
const COMMENT_REGION_LEFT_PCT = 9.15;
/**
 * 下端フクロウ本体が始まるおおよその左端（%）。
 * large の commentWidth 62.2% は吹き出し全体用。スマホは本体手前まで広げる。
 */
const OWL_ART_SAFE_LEFT_BY_TIER = { small: 62.5, medium: 66 } as const;
/** イラストとの隙間（ギリギリまで広げるため最小） */
const COMMENT_WIDTH_MARGIN_PCT = 0.15;

function commentMaxWidthPct(tier: "small" | "medium"): string {
  const safeLeft = OWL_ART_SAFE_LEFT_BY_TIER[tier];
  const w = safeLeft - COMMENT_REGION_LEFT_PCT - COMMENT_WIDTH_MARGIN_PCT;
  return `${w.toFixed(2)}%`;
}

/** small / medium の本文枠（コメント帯・フクロウ頭の手前で打ち切り） */
export const DIARY_PREVIEW_TIER_BODY: Record<
  "small" | "medium",
  {
    region: DiaryPreviewRegionBox;
    scrollAffordance: DiaryPreviewScrollAffordance;
  }
> = {
  small: {
    region: {
      left: "13.2%",
      top: "55%",
      width: "72.8%",
      /** 見た目優先：フクロウ頭手前で余白を確保（全文は枠内スクロール） */
      heightPct: "17.5%",
    },
    scrollAffordance: { gradient: true, rail: true, chevron: true },
  },
  medium: {
    region: {
      left: "13.2%",
      top: "55%",
      width: "72.8%",
      heightPct: "19%",
    },
    scrollAffordance: { gradient: true, rail: true, chevron: false },
  },
} as const;

/** small / medium のフクロウ欄 */
export const DIARY_PREVIEW_TIER_COMMENT: Record<
  "small" | "medium",
  {
    region: DiaryPreviewRegionBox;
    fontSize: string;
    lineHeight: string;
    scrollAffordance: DiaryPreviewScrollAffordance;
  }
> = {
  small: {
    region: {
      left: "9.15%",
      top: "79.2%",
      width: commentMaxWidthPct("small"),
      heightPct: "17.5%",
    },
    fontSize: "clamp(8px, min(1.88cqw, 2.48cqh), 10.5px)",
    lineHeight: "1.44",
    scrollAffordance: { gradient: true, rail: true, chevron: true },
  },
  medium: {
    region: {
      left: "9.15%",
      top: "79.2%",
      width: commentMaxWidthPct("medium"),
      heightPct: "18.5%",
    },
    fontSize: "clamp(9.5px, min(2.05cqw, 2.15cqh), 12px)",
    lineHeight: "1.36",
    scrollAffordance: { gradient: true, rail: true, chevron: true },
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
