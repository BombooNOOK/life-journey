import { GUARDIAN_COLORS } from "@/lib/kantei/todayHintContent";

import { guardianColorStyle, type GuardianColorCardStyle } from "./guardianColorStyles";

/** お守りカラー名を正規化（空白除去・既知ラベルに寄せる） */
export function normalizeGuardianColorName(colorName: string | null | undefined): string | null {
  const trimmed = colorName?.trim();
  if (!trimmed) return null;
  if ((GUARDIAN_COLORS as readonly string[]).includes(trimmed)) return trimmed;
  return trimmed;
}

export function guardianColorStyleForName(
  colorName: string | null | undefined,
): GuardianColorCardStyle {
  return guardianColorStyle(normalizeGuardianColorName(colorName));
}

export function guardianColorTextColorForName(colorName: string | null | undefined): string {
  return guardianColorStyleForName(colorName).textColor;
}
