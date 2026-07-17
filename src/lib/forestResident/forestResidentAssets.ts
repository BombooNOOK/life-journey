import type { ForestResidentBadge, ForestResidentFaceIcon } from "@/lib/forestResident/forestResidentCardShared";

const BASE = "/images/ljd/forest-resident" as const;

/** テンプレート差し替え時にインクリメント（ブラウザ・Next 画像キャッシュ回避） */
const FOREST_RESIDENT_CARD_CACHE_VERSION = 3;
const FOREST_RESIDENT_BADGE_CACHE_VERSION = 2;

export const FOREST_RESIDENT_CARD_SRC =
  `${BASE}/forest_resident_card.png?v=${FOREST_RESIDENT_CARD_CACHE_VERSION}` as const;

export const forestResidentBadgeSrc: Record<ForestResidentBadge, string> = {
  green: `${BASE}/forest_resident_badge_green.png?v=${FOREST_RESIDENT_BADGE_CACHE_VERSION}`,
  silver: `${BASE}/forest_resident_badge_silver.png?v=${FOREST_RESIDENT_BADGE_CACHE_VERSION}`,
  gold: `${BASE}/forest_resident_badge_gold.png?v=${FOREST_RESIDENT_BADGE_CACHE_VERSION}`,
};

export const forestResidentFaceSrc: Record<ForestResidentFaceIcon, string> = {
  rabbit: `${BASE}/forest_resident_face_rabbit.png`,
};

export const forestResidentBodySrc: Record<ForestResidentFaceIcon, string> = {
  rabbit: `${BASE}/forest_resident_body_rabbit.png`,
};

/** 楕円枠内の顔 PNG 調整（会話アイコンと同じ objectPosition + scale） */
export type ForestResidentFaceTuning = {
  /** 画像のどの点を枠の中心に合わせるか（例: "41% 34%"） */
  objectPosition: string;
  /** 拡大率（1.0 = 枠いっぱいに cover） */
  scale: number;
};

export const forestResidentFaceTuning: Record<ForestResidentFaceIcon, ForestResidentFaceTuning> = {
  rabbit: { objectPosition: "50% 50%", scale: 0.84 },
};

export const FOREST_RESIDENT_BADGE_LABEL: Record<ForestResidentBadge, string> = {
  green: "グリーンバッジ",
  silver: "シルバーバッジ",
  gold: "ゴールドバッジ",
};

/**
 * 住民票テンプレート（720×720）上の配置（%）。
 * face = テンプレートの楕円枠。顔 PNG の見え方は forestResidentFaceTuning で調整。
 */
export const FOREST_RESIDENT_CARD_LAYOUT = {
  face: {
    left: 12.5,
    top: 34.7,
    width: 22.9,
    height: 29.1,
  },
  lines: {
    left: 55,
    width: 46,
    height: 4.8,
    rows: [38.5, 45.8, 55.5], // 720px 基準で上へ 3px（累計 6px）
  },
  badge: {
    image: {
      // 720px 基準（9.4% から右へ 3px ≈ 9.0%）
      right: 9.0,
      bottom: 11.2,
      width: 22.8,
      aspectRatio: 22 / 28,
    },
    label: {
      left: 48.8,
      top: 65.6,
      width: 24,
      height: 4,
    },
  },
} as const;

export const FOREST_RESIDENT_CARD_FIELD_ORDER = [
  "displayName",
  "residentNumber",
  "registeredAtLabel",
] as const;
