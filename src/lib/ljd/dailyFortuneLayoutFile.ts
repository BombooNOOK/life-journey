import type {
  DailyFortuneLayoutSlotId,
  DailyFortunePercentRect,
} from "@/lib/ljd/dailyFortuneLayout";
import { DAILY_FORTUNE_LAYOUT_SLOT_IDS } from "@/lib/ljd/dailyFortuneLayout";

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, "");
}

function rectLine(id: string, rect: DailyFortunePercentRect): string {
  return `  ${id}: { left: ${fmt(rect.left)}, top: ${fmt(rect.top)}, width: ${fmt(rect.width)}, height: ${fmt(rect.height)} },`;
}

export function isDailyFortunePercentRect(value: unknown): value is DailyFortunePercentRect {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.left === "number" &&
    typeof r.top === "number" &&
    typeof r.width === "number" &&
    typeof r.height === "number"
  );
}

/** 定規の下書きから dailyFortuneLayout.ts 全文を生成 */
export function buildDailyFortuneLayoutTsSource(
  layout: Record<DailyFortuneLayoutSlotId, DailyFortunePercentRect>,
): string {
  const layoutLines = DAILY_FORTUNE_LAYOUT_SLOT_IDS.map((id) => rectLine(id, layout[id]));

  return `import type { CSSProperties } from "react";

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
${layoutLines.join("\n")}
};

export function dailyFortuneRectStyle(rect: DailyFortunePercentRect): CSSProperties {
  return {
    position: "absolute",
    left: \`\${rect.left}%\`,
    top: \`\${rect.top}%\`,
    width: \`\${rect.width}%\`,
    height: \`\${rect.height}%\`,
  };
}

export function dailyFortuneStageContainStyle(): CSSProperties {
  const { widthPx, heightPx } = DAILY_FORTUNE_BG_INTRINSIC;
  const ratio = widthPx / heightPx;
  return {
    position: "relative",
    width: \`min(100vw, calc(100dvh * \${ratio}))\`,
    height: \`min(100dvh, calc(100vw / \${ratio}))\`,
    margin: "0 auto",
  };
}

/** 定規など、親幅に合わせて縦横比固定するとき */
export function dailyFortuneStageFillParentStyle(): CSSProperties {
  const { widthPx, heightPx } = DAILY_FORTUNE_BG_INTRINSIC;
  return {
    position: "relative",
    width: "100%",
    aspectRatio: \`\${widthPx} / \${heightPx}\`,
  };
}
`;
}
