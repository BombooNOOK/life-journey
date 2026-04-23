export interface StoneCandidate {
  id: string;
  nameJa: string;
  tags: string[];
}

export interface StonesMasterFile {
  version: number;
  description?: string;
  byNumber: Record<string, StoneCandidate[]>;
  charmByNumber: Record<string, StoneCandidate[]>;
}

export interface StoneSelection {
  /** メイン守護石（ライフパス基準 + スコアリング） */
  mainStone: StoneCandidate;
  /** サブ候補（同スコア帯） */
  mainAlternates: StoneCandidate[];
  /** お守り石（別枠マスター） */
  charmStone: StoneCandidate;
  charmAlternates: StoneCandidate[];
  /** デバッグ用: 選定理由の簡易メモ */
  rationale: string[];
}

export type AppraisalCoreKey = "lifePath" | "destiny" | "soul" | "personality" | "birthday";

export interface AppraisalStoneItem {
  key: AppraisalCoreKey;
  label: string;
  number: number | null;
  color: string;
  targetNumber: number | null;
  colorGroup: string;
  keywords: string[];
  shortEffectSummary: string;
  candidates: StoneCandidate[];
  selected: StoneCandidate | null;
  reason: string;
  /** 鑑定書 PDF v4 の本文（採用石があるときのみ） */
  stonePdfBody: { featureText: string; powerText: string } | null;
  /** 関心テーマが中立でなく、採用石にテーマ一致ボーナスが付いたか（一覧ページ文面用） */
  focusThemeMatched: boolean;
}

export interface AppraisalStoneSelection {
  items: AppraisalStoneItem[];
}

export interface StoneCatalogEntry {
  id: string;
  stoneName: string;
  targetNumber: number;
  colorGroup: string;
  keywords: string[];
  shortEffectSummary: string;
}
