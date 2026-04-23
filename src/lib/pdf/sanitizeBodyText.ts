/**
 * 鑑定書本文向け: ソフトハイフン（U+00AD）と ASCII ハイフン（U+002D）を除去する。
 * Word 等から貼り付けた原稿に紛れ込むことがあり、行末に不要な "-" が出る原因になる。
 *
 * 【走査済みの本文ソース（リポジトリ内の静的原稿）】
 * - src/lib/numerology/*Data.ts（lifePath / destiny / soul / personality / birthday / maturity）
 * - src/lib/numerology/bridgeProfiles.ts（ブリッジ本文・bridgeIntro 等）
 * - src/lib/numerology/bridgeReferenceData.ts（参考ページの短い文言）
 * - src/lib/numerology/data/personalYearCycleData.ts（パーソナルイヤー原稿）
 * - src/lib/numerology/lifePathDestinyBridge.ts（ブリッジ行データがある場合）
 *
 * 上記を UTF-8 として読み、U+00AD の有無・和文直近の ASCII "-" を確認したところ、
 * 現時点のコミットでは該当文字は見つからなかった（ハイフンは主にレイアウト由来の可能性）。
 * それでも PDF 出力直前で本関数を通すと、DB 差し替えや将来の原稿混入にも耐えられる。
 */
export function sanitizePdfBodyText(input: string): string {
  return input.replaceAll("\u00ad", "").replaceAll("-", "");
}
