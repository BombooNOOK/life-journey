import stonePdfV4Json from "../../../data/stonePdfV4.json";
import { COLOR_BY_NUMBER } from "./catalog";
import type { StoneCatalogEntry, StoneCandidate, StonesMasterFile } from "./types";
import type { StonePdfV4Entry, StonePdfV4File } from "./stonePdfV4Types";
import { shortEffectSummaryFromStonePdf } from "./stonePdfV4Summary";
import { inferEnglishTagsFromPdf } from "./stonePdfV4Tags";

const MASTER_KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33] as const;

let entriesCache: StonePdfV4Entry[] | null = null;
let idIndex: Map<string, StonePdfV4Entry> | null = null;

export function getAllStonePdfV4Entries(): StonePdfV4Entry[] {
  if (!entriesCache) entriesCache = (stonePdfV4Json as StonePdfV4File).entries;
  return entriesCache;
}

function allEntries(): StonePdfV4Entry[] {
  return getAllStonePdfV4Entries();
}

/** 鑑定書 PDF v4 由来のエントリを id で引く（本文表示用） */
export function getStonePdfV4EntryById(id: string): StonePdfV4Entry | undefined {
  if (!idIndex) {
    idIndex = new Map();
    for (const e of allEntries()) idIndex.set(e.id, e);
  }
  return idIndex.get(id);
}

function colorGroupStrict(n: number): string | undefined {
  return COLOR_BY_NUMBER[n];
}

function isNumerologyForNumber(e: StonePdfV4Entry, n: number): boolean {
  if (e.category !== "numerology" || e.targetNumber !== n) return false;
  const expected = colorGroupStrict(n);
  if (!expected) return false;
  return true;
}

function toCandidate(e: StonePdfV4Entry): StoneCandidate {
  return {
    id: e.id,
    nameJa: e.stoneName,
    tags: inferEnglishTagsFromPdf(e),
  };
}

/**
 * 鑑定書用石説明 PDF v4（stonePdfV4.json）のみを正とするカタログ。
 * 各 targetNumber の色は COLOR_BY_NUMBER に一致するナンバー別ブロックの石だけ。
 */
export function buildStoneCatalogFromStonePdfV4(): StoneCatalogEntry[] {
  const out: StoneCatalogEntry[] = [];
  for (const e of allEntries()) {
    if (e.category !== "numerology" || e.targetNumber == null) continue;
    const tn = e.targetNumber;
    const colorGroup = colorGroupStrict(tn);
    if (!colorGroup) continue;
    const keywords = [...new Set([...e.headlineKeywords, ...e.numerologyKeywords])];
    out.push({
      id: e.id,
      stoneName: e.stoneName,
      targetNumber: tn,
      colorGroup,
      keywords,
      shortEffectSummary: shortEffectSummaryFromStonePdf(e),
    });
  }
  return out;
}

/**
 * selectStones 用マスター。byNumber / charmByNumber はいずれも同一ナンバーの PDF 候補（お守りは select でメインと重複回避）。
 */
export function buildStonesMasterFromStonePdfV4(): StonesMasterFile {
  const byNumber: Record<string, StoneCandidate[]> = {};
  const charmByNumber: Record<string, StoneCandidate[]> = {};
  for (const k of MASTER_KEYS) {
    const list = allEntries()
      .filter((e) => isNumerologyForNumber(e, k))
      .map(toCandidate);
    const key = String(k);
    byNumber[key] = list;
    charmByNumber[key] = list.map((c) => ({ ...c, tags: [...c.tags] }));
  }
  return {
    version: 2,
    description: "鑑定書用石説明改訂版v4（data/stonePdfV4.json）由来",
    byNumber,
    charmByNumber,
  };
}
