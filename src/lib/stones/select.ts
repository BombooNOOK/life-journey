import type { NumerologyResult } from "@/lib/numerology/types";
import type { StoneCandidate, StoneSelection } from "./types";
import { loadStonesMaster } from "./loadMaster";
import {
  focusThemeBonusForStoneId,
  isNeutralStoneFocusTheme,
  normalizeStoneFocusThemeLabel,
} from "./stoneFocusTheme";

function keyForCore(n: number): string {
  return String(n);
}

function scoreCandidateBase(c: StoneCandidate, primary: number, context: Set<number>): number {
  let score = 3;
  if (context.has(primary)) score += 2;
  for (const t of c.tags) {
    if (t === "master" && (primary === 11 || primary === 22 || primary === 33)) {
      score += 2;
    }
  }
  for (const n of context) {
    if (n === primary) continue;
    if (c.tags.includes("harmony") && (n === 2 || n === 6)) score += 1;
    if (c.tags.includes("spirit") && n === 7) score += 1;
    if (c.tags.includes("love") && (n === 6 || n === 9)) score += 1;
  }
  return score;
}

export type SelectStonesOptions = {
  focusThemeLabel?: string;
};

function pickFromList(
  list: StoneCandidate[] | undefined,
  primary: number,
  context: Set<number>,
  focusThemeLabel: string,
): { top: StoneCandidate; alternates: StoneCandidate[] } {
  if (!list?.length) {
    return {
      top: { id: "unknown", nameJa: "（マスター未登録）", tags: [] },
      alternates: [],
    };
  }
  const neutral = isNeutralStoneFocusTheme(focusThemeLabel);
  const indexed = list.map((c, idx) => ({ c, idx }));
  indexed.sort((a, b) => {
    const sb = scoreCandidateBase(b.c, primary, context);
    const sa = scoreCandidateBase(a.c, primary, context);
    if (sb !== sa) return sb - sa;
    if (!neutral) {
      const tb = focusThemeBonusForStoneId(b.c.id, focusThemeLabel);
      const ta = focusThemeBonusForStoneId(a.c.id, focusThemeLabel);
      if (tb !== ta) return tb - ta;
    }
    return a.idx - b.idx;
  });
  const ranked = indexed.map((x) => x.c);
  const topBase = scoreCandidateBase(ranked[0], primary, context);
  const topTheme = neutral ? 0 : focusThemeBonusForStoneId(ranked[0].id, focusThemeLabel);
  const sameTier = ranked.filter((c) => {
    if (scoreCandidateBase(c, primary, context) !== topBase) return false;
    if (neutral) return true;
    return focusThemeBonusForStoneId(c.id, focusThemeLabel) === topTheme;
  });
  return {
    top: ranked[0],
    alternates: sameTier.slice(1, 4),
  };
}

/**
 * ルールベース: 主軸はライフパス。ディスティニー・ソウル・バースデーも重み付き集合に入れてスコア調整。
 * お守り石は charmByNumber を別枠で参照。
 * 関心テーマは候補の絞り込み後、同点帯内の優先度付けにのみ使う。
 */
export function selectStones(
  result: NumerologyResult,
  options?: SelectStonesOptions,
): StoneSelection {
  const focusThemeLabel = normalizeStoneFocusThemeLabel(options?.focusThemeLabel);
  const master = loadStonesMaster();
  const lp = result.lifePathNumber;
  const context = new Set<number>([lp, result.birthdayNumber]);
  if (result.destinyNumber != null) context.add(result.destinyNumber);
  if (result.soulNumber != null) context.add(result.soulNumber);
  if (result.personalityNumber != null) context.add(result.personalityNumber);

  const mainList = master.byNumber[keyForCore(lp)] ?? master.byNumber[String(lp)];
  const charmListRaw =
    master.charmByNumber[keyForCore(lp)] ?? master.charmByNumber[String(lp)];

  const main = pickFromList(mainList, lp, context, focusThemeLabel);
  const charmFiltered =
    charmListRaw?.filter((c) => c.id !== main.top.id) ?? charmListRaw ?? [];
  const charm = pickFromList(
    charmFiltered.length > 0 ? charmFiltered : charmListRaw,
    lp,
    context,
    focusThemeLabel,
  );

  const rationale = [
    `主軸LP=${lp}、文脈ナンバー: ${[...context].sort((a, b) => a - b).join(", ")}`,
    `メイン候補からスコア最大を採用（同点は関心テーマ一致→リスト順）。`,
    `お守りは charmByNumber[${lp}] を別枠で選択。`,
  ];

  return {
    mainStone: main.top,
    mainAlternates: main.alternates,
    charmStone: charm.top,
    charmAlternates: charm.alternates,
    rationale,
  };
}
