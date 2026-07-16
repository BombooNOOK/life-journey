import {
  dailyFortuneMotifSrc,
  dailyFortunePaletteSrc,
  type DailyFortuneColorKey,
} from "@/lib/ljd/dailyFortuneAssets";

export type DailyFortuneColorAsset = {
  key: DailyFortuneColorKey;
  /** 画面表示用ラベル */
  label: string;
  paletteSrc: string;
  motifSrc: string;
};

/** アセットキー → 表示名 */
export const DAILY_FORTUNE_COLOR_DISPLAY_LABEL: Record<DailyFortuneColorKey, string> = {
  red: "赤",
  "orange-brown": "オレンジ・茶",
  yellow: "黄",
  green: "緑",
  blue: "青",
  darkblue: "紺・藍色",
  purple: "紫",
  pink: "ピンク",
  white: "白",
  silver: "銀",
  gold: "ゴールド",
  multicolor: "マルチカラー",
};

/** 既存／別名ラベル → アセットキー */
const COLOR_KEY_BY_LABEL: Record<string, DailyFortuneColorKey> = {
  赤: "red",
  オレンジ: "orange-brown",
  "オレンジ・茶": "orange-brown",
  "橙・茶": "orange-brown",
  橙: "orange-brown",
  茶: "orange-brown",
  黄: "yellow",
  緑: "green",
  青: "blue",
  藍: "darkblue",
  紺: "darkblue",
  紺色: "darkblue",
  "紺・藍色": "darkblue",
  紫: "purple",
  ピンク: "pink",
  ゴールド: "gold",
  白: "white",
  銀: "silver",
  シルバー: "silver",
  金: "gold",
  マルチカラー: "multicolor",
};

const FALLBACK_KEY: DailyFortuneColorKey = "green";

export function resolveDailyFortuneColorAsset(
  guardianColorLabel: string | null | undefined,
): DailyFortuneColorAsset {
  const raw = guardianColorLabel?.trim() || "";
  const key = (raw && COLOR_KEY_BY_LABEL[raw]) || FALLBACK_KEY;
  return {
    key,
    label: DAILY_FORTUNE_COLOR_DISPLAY_LABEL[key],
    paletteSrc: dailyFortunePaletteSrc(key),
    motifSrc: dailyFortuneMotifSrc(key),
  };
}
