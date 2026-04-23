import { COLOR_BY_NUMBER } from "./catalog";
import { getAllStonePdfV4Entries, getStonePdfV4EntryById } from "./stonePdfV4Master";
import { shortEffectSummaryFromStonePdf } from "./stonePdfV4Summary";
import type { StonePdfV4Entry, StonePdfV4File } from "./stonePdfV4Types";

export type { StonePdfV4Entry, StonePdfV4File, StonePdfV4Category } from "./stonePdfV4Types";

export { getStonePdfV4EntryById, shortEffectSummaryFromStonePdf };

/** PDF v4 から生成したエントリ一覧（要約なし・本文は featureText / powerText） */
export function loadStonePdfV4(): StonePdfV4Entry[] {
  return getAllStonePdfV4Entries();
}

/** 数秘ナンバーに対応する色分類（catalog の COLOR_BY_NUMBER と一致） */
export function colorGroupForStonePdfEntry(targetNumber: number | null): string | null {
  if (targetNumber == null) return null;
  return COLOR_BY_NUMBER[targetNumber] ?? null;
}
