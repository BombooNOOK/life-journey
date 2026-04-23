/**
 * ひらがなブロック（ゔ・ゕゖ含む）＋長音「ー」(U+30FC)。
 * 長音は入力上は許可し、ローマ字変換前に直前の母音へ展開して正規化する。
 */
const HIRAGANA_ONLY = /^[\u3041-\u3096\u30FC]+$/;

export function isHiraganaOnly(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  return HIRAGANA_ONLY.test(t);
}
