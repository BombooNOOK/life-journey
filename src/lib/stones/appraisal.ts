import type { NumerologyResult } from "@/lib/numerology/types";
import { maturityNumberFromNumerology } from "@/lib/numerology/reduce";

import { buildStoneCatalog, COLOR_BY_NUMBER, groupStoneCatalogByColor } from "./catalog";
import { loadStonesMaster } from "./loadMaster";
import type {
  AppraisalCoreKey,
  AppraisalStoneItem,
  AppraisalStoneSelection,
  StoneCandidate,
  StoneCatalogEntry,
} from "./types";
import {
  focusThemeBonusForStoneId,
  isNeutralStoneFocusTheme,
  normalizeStoneFocusThemeLabel,
} from "./stoneFocusTheme";
import { buildAppraisalStoneReasonJa } from "./stoneSelectionReasonJa";
import { getStonePdfV4EntryById } from "./stonePdfV4Master";

const CORE_ORDER: Array<{ key: AppraisalCoreKey; label: string }> = [
  { key: "lifePath", label: "LP" },
  { key: "destiny", label: "D" },
  { key: "soul", label: "S" },
  { key: "personality", label: "P" },
  { key: "birthday", label: "BD" },
];

const CORE_TAG_HINTS: Record<AppraisalCoreKey, string[]> = {
  lifePath: ["initiative", "leadership", "stability", "power", "master"],
  destiny: ["leadership", "builder", "expression", "truth", "business"],
  soul: ["love", "intuition", "peace", "spirit", "healing"],
  personality: ["communication", "confidence", "analysis", "harmony", "protection"],
  birthday: ["vitality", "grounding", "focus", "wisdom", "change"],
};

function numberForKey(n: NumerologyResult, key: AppraisalCoreKey): number | null {
  if (key === "lifePath") return n.lifePathNumber;
  if (key === "destiny") return n.destinyNumber;
  if (key === "soul") return n.soulNumber;
  if (key === "personality") return n.personalityNumber;
  return n.birthdayNumber;
}

function colorForNumber(number: number | null): string {
  if (number == null) return "未確定";
  return COLOR_BY_NUMBER[number] ?? "未定義";
}

function scoreCandidateForCore(
  c: StoneCandidate,
  key: AppraisalCoreKey,
  maturity: number | null,
  usedKeywords: Map<string, number>,
): number {
  const hints = CORE_TAG_HINTS[key];
  let score = 0;
  for (const t of c.tags) {
    if (hints.includes(t)) score += 2;
  }
  // 同じ役割タグばかりが続かないよう軽く分散させる
  for (const t of c.tags) {
    const used = usedKeywords.get(t) ?? 0;
    if (used > 0) score -= used * 0.5;
  }
  // マチュリティは主判定ではなく同点付近の微調整だけに使う
  if (maturity != null && c.tags.some((t) => t.includes("master"))) {
    score += 0.2;
  }
  if (c.tags.includes("master")) score += 1;
  return score;
}

function selectOne(
  candidates: StoneCandidate[],
  key: AppraisalCoreKey,
  maturity: number | null,
  usedKeywords: Map<string, number>,
  focusThemeLabel: string,
): { selected: StoneCandidate | null; focusThemeMatched: boolean } {
  if (candidates.length === 0) return { selected: null, focusThemeMatched: false };
  const scored = candidates.map((c, idx) => ({
    c,
    idx,
    core: scoreCandidateForCore(c, key, maturity, usedKeywords),
    theme: focusThemeBonusForStoneId(c.id, focusThemeLabel),
  }));
  scored.sort((a, b) => {
    const d = b.core + b.theme - (a.core + a.theme);
    if (d !== 0) return d;
    return a.idx - b.idx;
  });
  const top = scored[0]!;
  return {
    selected: top.c,
    focusThemeMatched: !isNeutralStoneFocusTheme(focusThemeLabel) && top.theme > 0,
  };
}

function candidatesForNumber(
  number: number | null,
  byColor: Record<string, StoneCatalogEntry[]>,
  masterByNumber: Record<string, StoneCandidate[]>,
): StoneCandidate[] {
  if (number == null) return [];
  const color = colorForNumber(number);
  const strictIds = new Set(
    (byColor[color] ?? []).filter((e) => e.targetNumber === number).map((e) => e.id),
  );
  const masterList = masterByNumber[String(number)] ?? [];
  const ordered = masterList.filter((c) => strictIds.has(c.id));
  if (ordered.length > 0) return ordered;
  return masterList;
}

export function selectAppraisalStones(
  numerology: NumerologyResult,
  options?: { focusThemeLabel?: string },
): AppraisalStoneSelection {
  const focusThemeLabel = normalizeStoneFocusThemeLabel(options?.focusThemeLabel);
  const master = loadStonesMaster();
  const maturity = maturityNumberFromNumerology(numerology);
  const catalog = buildStoneCatalog();
  const byColor = groupStoneCatalogByColor(catalog);
  const usedKeywords = new Map<string, number>();

  const items: AppraisalStoneItem[] = CORE_ORDER.map(({ key, label }) => {
    const number = numberForKey(numerology, key);
    const candidates = candidatesForNumber(number, byColor, master.byNumber);
    const { selected, focusThemeMatched } = selectOne(
      candidates,
      key,
      maturity,
      usedKeywords,
      focusThemeLabel,
    );
    if (selected) {
      for (const t of selected.tags) {
        usedKeywords.set(t, (usedKeywords.get(t) ?? 0) + 1);
      }
    }
    const selectedMeta =
      selected == null
        ? null
        : catalog.find((e) => e.id === selected.id && e.targetNumber === number) ??
          catalog.find((e) => e.id === selected.id) ??
          null;
    const pdfEntry = selected ? getStonePdfV4EntryById(selected.id) : undefined;
    const color = colorForNumber(number);
    return {
      key,
      label,
      number,
      color,
      targetNumber: number,
      colorGroup: color,
      keywords: selectedMeta?.keywords ?? selected?.tags ?? [],
      shortEffectSummary:
        selectedMeta?.shortEffectSummary ??
        (selected?.tags.slice(0, 3).join("・") || "データ準備中"),
      candidates,
      selected,
      reason:
        selected == null
          ? "候補が未登録のため選定できませんでした。"
          : buildAppraisalStoneReasonJa({
              key,
              focusThemeLabel,
              focusThemeMatched,
              stoneId: selected.id,
              stoneNameJa: selected.nameJa,
              number,
              color,
            }),
      stonePdfBody:
        pdfEntry != null
          ? { featureText: pdfEntry.featureText, powerText: pdfEntry.powerText }
          : null,
      focusThemeMatched,
    };
  });
  return { items };
}
