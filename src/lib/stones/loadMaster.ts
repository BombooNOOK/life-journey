import type { StonesMasterFile } from "./types";
import { buildStonesMasterFromStonePdfV4 } from "./stonePdfV4Master";

let cache: StonesMasterFile | null = null;

/** 鑑定書用石説明 PDF v4（data/stonePdfV4.json）由来の候補リスト */
export function loadStonesMaster(): StonesMasterFile {
  if (cache) return cache;
  cache = buildStonesMasterFromStonePdfV4();
  return cache;
}

export function clearStonesMasterCache(): void {
  cache = null;
}
