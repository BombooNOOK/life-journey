import type { NumerologyResult } from "@/lib/numerology/types";

import { selectStones, type SelectStonesOptions } from "./select";
import type { StoneSelection } from "./types";

/**
 * 守護石選定（`selectStones`）が数秘のどこを見ているか
 *
 * - **ライフ・パス（LP）** … 主軸。`data/stonePdfV4.json` 由来の `byNumber[LP]` と `charmByNumber[LP]` で
 *   「その LP 向けの候補リスト」を決める（リスト自体が LP で切り替わる。色は `COLOR_BY_NUMBER` に従う）。
 * - **バースデー（BD）** … 常に「文脈」セットに入り、候補ごとのスコア加点に使う。
 * - **ディスティニー / ソウル / パーソナリティ（D / S / P）** … `null` でなければ文脈に加え、
 *   `master` / `harmony` / `spirit` / `love` などのタグと組み合わせてスコアを調整する。
 *
 * **使わないもの**: ブリッジ（LP–D など）は選定ロジックに入っていない。
 */
export type StoneSelectionNumerologySlice = {
  lifePathNumber: number;
  birthdayNumber: number;
  destinyNumber: number | null;
  soulNumber: number | null;
  personalityNumber: number | null;
};

export function getStoneSelectionNumerologySlice(
  n: NumerologyResult,
): StoneSelectionNumerologySlice {
  return {
    lifePathNumber: n.lifePathNumber,
    birthdayNumber: n.birthdayNumber,
    destinyNumber: n.destinyNumber,
    soulNumber: n.soulNumber,
    personalityNumber: n.personalityNumber,
  };
}

/**
 * 保存済み `numerologyJson` を更新せず、**いまの数秘スナップショット**から守護石だけを選び直す。
 * （注文詳細の表示比較用。DB の `stonesJson` は書き換えない。）
 */
export function recalculateStonesFromNumerology(
  n: NumerologyResult,
  options?: SelectStonesOptions,
): StoneSelection {
  return selectStones(n, options);
}

export function numerologyCoreEqualForStones(a: NumerologyResult, b: NumerologyResult): boolean {
  const sa = getStoneSelectionNumerologySlice(a);
  const sb = getStoneSelectionNumerologySlice(b);
  return (
    sa.lifePathNumber === sb.lifePathNumber &&
    sa.birthdayNumber === sb.birthdayNumber &&
    sa.destinyNumber === sb.destinyNumber &&
    sa.soulNumber === sb.soulNumber &&
    sa.personalityNumber === sb.personalityNumber
  );
}

export function stoneSelectionsEquivalent(a: StoneSelection, b: StoneSelection): boolean {
  return a.mainStone.id === b.mainStone.id && a.charmStone.id === b.charmStone.id;
}

/**
 * 初心者向け: なぜ石がズレうるかの短文ヒント（表示用）
 */
export function stoneDriftHints(args: {
  numerologyAtSave: NumerologyResult | null;
  numerologyCurrent: NumerologyResult | null;
  stonesStored: StoneSelection | null;
  stonesRecalculated: StoneSelection | null;
}): string[] {
  const { numerologyAtSave, numerologyCurrent, stonesStored, stonesRecalculated } = args;
  const lines: string[] = [];

  if (!numerologyAtSave || !numerologyCurrent) {
    return ["数秘データを正しく読めないため、差の説明は省略します。"];
  }

  if (numerologyAtSave.lifePathNumber !== numerologyCurrent.lifePathNumber) {
    lines.push(
      "ライフ・パス（LP）が保存時と違うと、参照する石のリスト（メイン・お守り）が別番号に切り替わるため、石が変わりやすいです。",
    );
  }

  if (numerologyAtSave.birthdayNumber !== numerologyCurrent.birthdayNumber) {
    lines.push(
      "バースデー（BD）が保存時と違うと、同じ LP のリスト内でもスコアが変わり、選ばれる石が変わることがあります。",
    );
  }

  if (
    numerologyAtSave.destinyNumber !== numerologyCurrent.destinyNumber ||
    numerologyAtSave.soulNumber !== numerologyCurrent.soulNumber ||
    numerologyAtSave.personalityNumber !== numerologyCurrent.personalityNumber
  ) {
    lines.push(
      "ディスティニー・ソウル・パーソナリティのいずれかが保存時と違うと、文脈スコアが変わり石が変わることがあります（通常は注文時のローマ字名から決まり、保存 JSON と一致します）。",
    );
  }

  if (stonesStored && stonesRecalculated) {
    const sameNum = numerologyCoreEqualForStones(numerologyAtSave, numerologyCurrent);
    const sameStone = stoneSelectionsEquivalent(stonesStored, stonesRecalculated);
    if (sameNum && sameStone) {
      lines.push("数値（LP・BD・D/S/P）もメイン／お守りの id も、保存時と再計算で一致しています。");
    } else if (sameNum && !sameStone) {
      lines.push(
        "数値は一致していますが、石だけ違います。`data/stonePdfV4.json` の差し替えや、同点時の並び順の違いが考えられます。",
      );
    } else if (!sameNum && sameStone) {
      lines.push(
        "数値は保存時と違いますが、選ばれたメイン／お守りの id は偶然一致しています。",
      );
    }
  }

  return lines;
}
