import { bridgeMeaning, bridgeProfiles } from "./bridgeProfiles";

/** 参考ページの導入（原稿差し替え可） */
export const bridgeReferenceIntro = {
  title: "ブリッジナンバー参考（全タイプ）",
  lead: "ここではブリッジナンバーのタイプ一覧を示します。お客様個別の結果は、前ページの各ブリッジ解説をご覧ください。",
};

/** 鑑定で扱うブリッジの組み合わせ 10 種（略称: LP, D, S, P, BD） */
export const bridgePairTypeLabels: string[] = [
  "1. LP × D（ライフパス × ディスティニー）",
  "2. LP × S（ライフパス × ソウル）",
  "3. LP × P（ライフパス × パーソナリティ）",
  "4. LP × BD（ライフパス × バースデー）",
  "5. D × S（ディスティニー × ソウル）",
  "6. D × P（ディスティニー × パーソナリティ）",
  "7. D × BD（ディスティニー × バースデー）",
  "8. S × P（ソウル × パーソナリティ）",
  "9. S × BD（ソウル × バースデー）",
  "10. P × BD（パーソナリティ × バースデー）",
];

/** ブリッジナンバー 0〜8 の意味（bridgeMeaning と同期） */
export function bridgeNumberMeaningsForReference(): { number: number; text: string }[] {
  return Object.entries(bridgeMeaning)
    .map(([k, text]) => ({ number: Number(k), text }))
    .sort((a, b) => a.number - b.number);
}

/**
 * bridgeProfiles の pairKey 一覧（全ブリッジペアで共通のキー集合）。
 */
export function lifePathDestinyPairKeysSorted(): string[] {
  return Object.keys(bridgeProfiles).sort();
}

/** 後から差し込む長文セクション用の枠 */
export type BridgeReferenceExtraSection = {
  id: string;
  title: string;
  body: string;
};

export const bridgeReferenceExtraSections: BridgeReferenceExtraSection[] = [];
