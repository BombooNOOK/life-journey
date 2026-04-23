import { buildStoneCatalogFromStonePdfV4 } from "./stonePdfV4Master";
import type { StoneCatalogEntry } from "./types";

export const COLOR_BY_NUMBER: Record<number, string> = {
  1: "赤",
  2: "白",
  3: "黄",
  4: "緑",
  5: "青",
  6: "ピンク",
  7: "紺・藍",
  8: "橙・茶",
  9: "紫",
  11: "シルバー",
  22: "ゴールド",
  33: "虹",
};

/**
 * 鑑定書用石説明 PDF v4（data/stonePdfV4.json）を正とするカタログ。
 */
export function buildStoneCatalog(): StoneCatalogEntry[] {
  return buildStoneCatalogFromStonePdfV4();
}

export function groupStoneCatalogByColor(catalog: StoneCatalogEntry[]): Record<string, StoneCatalogEntry[]> {
  const grouped: Record<string, StoneCatalogEntry[]> = {};
  for (const e of catalog) {
    if (!grouped[e.colorGroup]) grouped[e.colorGroup] = [];
    grouped[e.colorGroup].push(e);
  }
  return grouped;
}
