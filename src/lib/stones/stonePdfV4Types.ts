/** 鑑定書用石説明改訂版v4 から生成した構造化データ（data/stonePdfV4.json） */

export type StonePdfV4Category = "numerology" | "base" | "dharmaEye";

export interface StonePdfV4Entry {
  id: string;
  stoneName: string;
  /** 数秘で紐づく主番号。ベースの石・天眼石は null */
  targetNumber: number | null;
  category: StonePdfV4Category;
  sectionLabel: string | null;
  /** 見出し直下の箇条書きキーワード */
  headlineKeywords: string[];
  /** キャッチコピー（短文） */
  tagline: string;
  /** 「数秘 / 石のキーワード」欄のキーワード */
  numerologyKeywords: string[];
  /** *石の特徴 本文 */
  featureText: string;
  /** *石のパワー 本文 */
  powerText: string;
  source: {
    pdf: string;
    rawTextPath?: string;
  };
}

export interface StonePdfV4File {
  version: number;
  generatedBy?: string;
  input?: string;
  entryCount: number;
  entries: StonePdfV4Entry[];
}
