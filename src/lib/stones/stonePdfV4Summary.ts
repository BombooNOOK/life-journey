import type { StonePdfV4Entry } from "./stonePdfV4Types";

/**
 * 表示用の短い効能メモ（完全な本文の代替にはしない）
 */
export function shortEffectSummaryFromStonePdf(entry: StonePdfV4Entry): string {
  const pool = [...entry.headlineKeywords, ...entry.numerologyKeywords].filter(Boolean);
  const uniq = [...new Set(pool)];
  if (uniq.length === 0) return entry.tagline ? entry.tagline.slice(0, 40) : "";
  return uniq.slice(0, 5).join("・");
}
