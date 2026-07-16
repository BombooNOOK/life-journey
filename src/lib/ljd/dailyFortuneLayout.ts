import type { CSSProperties } from "react";

import { DAILY_FORTUNE_BG_INTRINSIC } from "@/lib/ljd/dailyFortuneAssets";

/** 設計座標（背景 1080×1920 基準の %） */
export type DailyFortunePercentRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type DailyFortuneLayoutSlotId =
  | "guideCharacter"
  | "guideText"
  | "message"
  | "colorLabel"
  | "colorPalette"
  | "colorMotif"
  | "smallAction"
  | "themeButton";

export const DAILY_FORTUNE_LAYOUT_SLOT_IDS: DailyFortuneLayoutSlotId[] = [
  "guideCharacter",
  "guideText",
  "message",
  "colorLabel",
  "colorPalette",
  "colorMotif",
  "smallAction",
  "themeButton",
];

export const DAILY_FORTUNE_LAYOUT_SLOT_LABELS: Record<DailyFortuneLayoutSlotId, string> = {
  guideCharacter: "届け役キャラ",
  guideText: "本日は…お届けします",
  message: "今日のひとこと",
  colorLabel: "お守りカラー名",
  colorPalette: "カラーパレット",
  colorMotif: "カラーモチーフ",
  smallAction: "今日の小さな行動",
  themeButton: "今年・今月のテーマ（タップ）",
};

/**
 * 今日の鑑定結果 — パーツ配置（%）
 * 基準: daily_fortune_background.png（1080×1920）
 * ※このファイルはレイアウト定規の「ファイルに保存」から更新できます。
 */
export const DAILY_FORTUNE_LAYOUT: Record<DailyFortuneLayoutSlotId, DailyFortunePercentRect> = {
  guideCharacter: { left: 6, top: 7.5, width: 28, height: 18 },
  guideText: { left: 26, top: 19.5, width: 54, height: 6 },
  message: { left: 24, top: 30.2, width: 58, height: 10.5 },
  colorLabel: { left: 27, top: 50.2, width: 50, height: 3.2 },
  colorPalette: { left: 12.5, top: 44.5, width: 16, height: 10 },
  colorMotif: { left: 67, top: 43.8, width: 30, height: 14 },
  smallAction: { left: 26.5, top: 62.5, width: 58, height: 9 },
  themeButton: { left: 14, top: 82.5, width: 72, height: 7.5 },
};

export function dailyFortuneRectStyle(rect: DailyFortunePercentRect): CSSProperties {
  return {
    position: "absolute",
    left: `${rect.left}%`,
    top: `${rect.top}%`,
    width: `${rect.width}%`,
    height: `${rect.height}%`,
  };
}

export function dailyFortuneStageContainStyle(): CSSProperties {
  const { widthPx, heightPx } = DAILY_FORTUNE_BG_INTRINSIC;
  const ratio = widthPx / heightPx;
  return {
    position: "relative",
    width: `min(100vw, calc(100dvh * ${ratio}))`,
    height: `min(100dvh, calc(100vw / ${ratio}))`,
    margin: "0 auto",
  };
}

/** 定規など、親幅に合わせて縦横比固定するとき */
export function dailyFortuneStageFillParentStyle(): CSSProperties {
  const { widthPx, heightPx } = DAILY_FORTUNE_BG_INTRINSIC;
  return {
    position: "relative",
    width: "100%",
    aspectRatio: `${widthPx} / ${heightPx}`,
  };
}
