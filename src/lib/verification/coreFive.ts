import type { NumerologyResult } from "@/lib/numerology/types";

/** 突合に使うコア5項目（ブリッジは含めない） */
export type CoreFiveSnapshot = Pick<
  NumerologyResult,
  "lifePathNumber" | "destinyNumber" | "soulNumber" | "personalityNumber" | "birthdayNumber"
>;

/** DBやフォームから受け取る期待値（未入力の項目は比較しない） */
export type ExpectedCoreFivePartial = Partial<{
  lifePathNumber: number;
  destinyNumber: number | null;
  soulNumber: number | null;
  personalityNumber: number | null;
  birthdayNumber: number;
}>;

export const CORE_FIVE_KEYS: (keyof CoreFiveSnapshot)[] = [
  "lifePathNumber",
  "destinyNumber",
  "soulNumber",
  "personalityNumber",
  "birthdayNumber",
];

const LABELS: Record<keyof CoreFiveSnapshot, string> = {
  lifePathNumber: "ライフ・パス",
  destinyNumber: "ディスティニー",
  soulNumber: "ソウル",
  personalityNumber: "パーソナリティ",
  birthdayNumber: "バースデー",
};

export function labelForCoreKey(key: keyof CoreFiveSnapshot): string {
  return LABELS[key];
}

export function snapshotFromNumerology(n: NumerologyResult): CoreFiveSnapshot {
  return {
    lifePathNumber: n.lifePathNumber,
    destinyNumber: n.destinyNumber,
    soulNumber: n.soulNumber,
    personalityNumber: n.personalityNumber,
    birthdayNumber: n.birthdayNumber,
  };
}

export type RowStatus = "match" | "mismatch" | "skipped";

export interface ComparisonRow {
  key: keyof CoreFiveSnapshot;
  label: string;
  actual: number | null;
  expected: number | null;
  status: RowStatus;
}

/** 期待値にキーがある項目だけ比較。名前由来が null のときは expected が数値なら不一致になる。 */
export function compareCoreFive(
  actual: CoreFiveSnapshot,
  expected: ExpectedCoreFivePartial,
): { rows: ComparisonRow[]; allComparedMatch: boolean } {
  const rows: ComparisonRow[] = [];
  let compared = 0;
  let matches = 0;

  for (const key of CORE_FIVE_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(expected, key)) {
      rows.push({
        key,
        label: LABELS[key],
        actual: actual[key],
        expected: null,
        status: "skipped",
      });
      continue;
    }
    const exp = expected[key] as number | null | undefined;
    const act = actual[key];
    compared += 1;
    const same = exp === act;
    if (same) matches += 1;
    rows.push({
      key,
      label: LABELS[key],
      actual: act,
      expected: exp ?? null,
      status: same ? "match" : "mismatch",
    });
  }

  return {
    rows,
    allComparedMatch: compared > 0 && matches === compared,
  };
}

export function parseExpectedJson(raw: string | null): ExpectedCoreFivePartial | null {
  if (!raw?.trim()) return null;
  try {
    const o = JSON.parse(raw) as unknown;
    if (!o || typeof o !== "object") return null;
    return o as ExpectedCoreFivePartial;
  } catch {
    return null;
  }
}
