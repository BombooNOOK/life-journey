/** お守りカラー名 → 保存演出カード用の控えめな枠・背景 */
export type GuardianColorCardStyle = {
  borderColor: string;
  backgroundColor: string;
  topAccent: string;
};

const DEFAULT_STYLE: GuardianColorCardStyle = {
  borderColor: "rgba(180, 155, 120, 0.35)",
  backgroundColor: "rgba(255, 252, 247, 0.92)",
  topAccent: "rgba(196, 154, 90, 0.55)",
};

export const GUARDIAN_COLOR_CARD_STYLES: Record<string, GuardianColorCardStyle> = {
  赤: {
    borderColor: "rgba(214, 96, 88, 0.38)",
    backgroundColor: "rgba(255, 246, 245, 0.94)",
    topAccent: "rgba(214, 96, 88, 0.5)",
  },
  オレンジ: {
    borderColor: "rgba(224, 142, 72, 0.38)",
    backgroundColor: "rgba(255, 249, 242, 0.94)",
    topAccent: "rgba(224, 142, 72, 0.5)",
  },
  黄: {
    borderColor: "rgba(210, 176, 64, 0.38)",
    backgroundColor: "rgba(255, 252, 236, 0.94)",
    topAccent: "rgba(210, 176, 64, 0.5)",
  },
  緑: {
    borderColor: "rgba(96, 164, 112, 0.38)",
    backgroundColor: "rgba(244, 252, 246, 0.94)",
    topAccent: "rgba(96, 164, 112, 0.5)",
  },
  青: {
    borderColor: "rgba(88, 142, 196, 0.38)",
    backgroundColor: "rgba(244, 249, 255, 0.94)",
    topAccent: "rgba(88, 142, 196, 0.5)",
  },
  藍: {
    borderColor: "rgba(72, 96, 168, 0.38)",
    backgroundColor: "rgba(242, 245, 255, 0.94)",
    topAccent: "rgba(72, 96, 168, 0.5)",
  },
  紫: {
    borderColor: "rgba(148, 104, 184, 0.38)",
    backgroundColor: "rgba(250, 246, 255, 0.94)",
    topAccent: "rgba(148, 104, 184, 0.5)",
  },
  ピンク: {
    borderColor: "rgba(214, 128, 152, 0.38)",
    backgroundColor: "rgba(255, 246, 250, 0.94)",
    topAccent: "rgba(214, 128, 152, 0.5)",
  },
  ゴールド: {
    borderColor: "rgba(196, 154, 90, 0.42)",
    backgroundColor: "rgba(255, 251, 242, 0.94)",
    topAccent: "rgba(196, 154, 90, 0.58)",
  },
};

export function guardianColorCardStyle(colorName: string | null | undefined): GuardianColorCardStyle {
  if (!colorName?.trim()) return DEFAULT_STYLE;
  return GUARDIAN_COLOR_CARD_STYLES[colorName.trim()] ?? DEFAULT_STYLE;
}
