/** お守りカラー名 → UI用スタイル（鑑定ページ・保存演出カード共通） */
export type GuardianColorCardStyle = {
  borderColor: string;
  backgroundColor: string;
  topAccent: string;
  /** カラー名の表示文字色 */
  textColor: string;
};

const DEFAULT_STYLE: GuardianColorCardStyle = {
  borderColor: "rgba(120, 120, 120, 0.32)",
  backgroundColor: "rgba(255, 252, 247, 0.92)",
  topAccent: "rgba(140, 140, 140, 0.45)",
  textColor: "#57534e",
};

export const GUARDIAN_COLOR_STYLES: Record<string, GuardianColorCardStyle> = {
  赤: {
    borderColor: "rgba(214, 96, 88, 0.42)",
    backgroundColor: "rgba(255, 246, 245, 0.94)",
    topAccent: "rgba(214, 96, 88, 0.55)",
    textColor: "#c45048",
  },
  オレンジ: {
    borderColor: "rgba(224, 142, 72, 0.42)",
    backgroundColor: "rgba(255, 249, 242, 0.94)",
    topAccent: "rgba(224, 142, 72, 0.55)",
    textColor: "#c87830",
  },
  "オレンジ・茶": {
    borderColor: "rgba(224, 142, 72, 0.42)",
    backgroundColor: "rgba(255, 249, 242, 0.94)",
    topAccent: "rgba(224, 142, 72, 0.55)",
    textColor: "#c87830",
  },
  黄: {
    borderColor: "rgba(190, 158, 48, 0.42)",
    backgroundColor: "rgba(255, 252, 236, 0.94)",
    topAccent: "rgba(190, 158, 48, 0.55)",
    textColor: "#a88a20",
  },
  緑: {
    borderColor: "rgba(42, 157, 85, 0.48)",
    backgroundColor: "rgba(244, 252, 246, 0.94)",
    topAccent: "rgba(42, 157, 85, 0.62)",
    textColor: "#2a9d55",
  },
  青: {
    borderColor: "rgba(72, 130, 190, 0.42)",
    backgroundColor: "rgba(244, 249, 255, 0.94)",
    topAccent: "rgba(72, 130, 190, 0.55)",
    textColor: "#3a7ab8",
  },
  藍: {
    borderColor: "rgba(56, 82, 158, 0.42)",
    backgroundColor: "rgba(242, 245, 255, 0.94)",
    topAccent: "rgba(56, 82, 158, 0.55)",
    textColor: "#3a5098",
  },
  "紺・藍色": {
    borderColor: "rgba(56, 82, 158, 0.42)",
    backgroundColor: "rgba(242, 245, 255, 0.94)",
    topAccent: "rgba(56, 82, 158, 0.55)",
    textColor: "#3a5098",
  },
  紺: {
    borderColor: "rgba(56, 82, 158, 0.42)",
    backgroundColor: "rgba(242, 245, 255, 0.94)",
    topAccent: "rgba(56, 82, 158, 0.55)",
    textColor: "#3a5098",
  },
  紺色: {
    borderColor: "rgba(56, 82, 158, 0.42)",
    backgroundColor: "rgba(242, 245, 255, 0.94)",
    topAccent: "rgba(56, 82, 158, 0.55)",
    textColor: "#3a5098",
  },
  紫: {
    borderColor: "rgba(132, 88, 168, 0.42)",
    backgroundColor: "rgba(250, 246, 255, 0.94)",
    topAccent: "rgba(132, 88, 168, 0.55)",
    textColor: "#7a50a0",
  },
  ピンク: {
    borderColor: "rgba(200, 108, 132, 0.42)",
    backgroundColor: "rgba(255, 246, 250, 0.94)",
    topAccent: "rgba(200, 108, 132, 0.55)",
    textColor: "#c06078",
  },
  ゴールド: {
    borderColor: "rgba(180, 138, 72, 0.45)",
    backgroundColor: "rgba(255, 251, 242, 0.94)",
    topAccent: "rgba(180, 138, 72, 0.58)",
    textColor: "#a87828",
  },
};

export function guardianColorStyle(colorName: string | null | undefined): GuardianColorCardStyle {
  if (!colorName?.trim()) return DEFAULT_STYLE;
  return GUARDIAN_COLOR_STYLES[colorName.trim()] ?? DEFAULT_STYLE;
}

/** @deprecated use guardianColorStyle */
export function guardianColorCardStyle(colorName: string | null | undefined): GuardianColorCardStyle {
  return guardianColorStyle(colorName);
}

export function guardianColorTextColor(colorName: string | null | undefined): string {
  return guardianColorStyle(colorName).textColor;
}
