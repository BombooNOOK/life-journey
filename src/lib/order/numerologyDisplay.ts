import {
  buildBridgeNumbersFromCore,
  refreshLifePathInNumerologyResult,
} from "@/lib/numerology/compute";
import type { BridgeNumbers, NumerologyResult } from "@/lib/numerology/types";

import { parseOrderBirthDateParts } from "./birthDate";

function coerceNullableCore(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function coerceFiniteCore(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * コアナンバーだけからブリッジ10種を再計算する（保存済み bridges は上書きして整合させる）。
 */
export function recomputeBridgesFromCoreNumbers(n: {
  lifePathNumber: number;
  destinyNumber: number | null;
  soulNumber: number | null;
  personalityNumber: number | null;
  birthdayNumber: number;
}): BridgeNumbers {
  return buildBridgeNumbersFromCore({
    lifePath: n.lifePathNumber,
    destiny: n.destinyNumber,
    soul: n.soulNumber,
    personality: n.personalityNumber,
    birthday: n.birthdayNumber,
  });
}

/**
 * DB / 旧版から来た不完全な numerologyJson でも落ちないよう、型と数値を整える。
 * bridges は常にコアナンバーから再計算し、旧3項目だけの JSON とも整合させる。
 */
export function normalizeNumerologyResult(raw: unknown): NumerologyResult | null {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const lifePathNumber = coerceFiniteCore(o.lifePathNumber, 0);
  const destinyNumber = coerceNullableCore(o.destinyNumber);
  const soulNumber = coerceNullableCore(o.soulNumber);
  const personalityNumber = coerceNullableCore(o.personalityNumber);
  const birthdayNumber = coerceFiniteCore(o.birthdayNumber, 0);
  const bridges = recomputeBridgesFromCoreNumbers({
    lifePathNumber,
    destinyNumber,
    soulNumber,
    personalityNumber,
    birthdayNumber,
  });
  return {
    lifePathNumber,
    destinyNumber,
    soulNumber,
    personalityNumber,
    birthdayNumber,
    bridges,
  };
}

export type OrderBirthDenorm = {
  birthYear: number;
  birthMonth: number;
  birthDay: number;
};

/**
 * 保存済み数秘 JSON に、現在のルールでライフ・パス・バースデーナンバー・LP 関連ブリッジを上書きする。
 * 生年月日が解釈できない場合は、正規化した保存値のみ返す（読み込み失敗にしない）。
 */
export function numerologyWithRefreshedLifePath(
  numerologyJson: string | null | undefined,
  birthDateIso: string | null | undefined,
  birthDenorm?: OrderBirthDenorm | null,
): NumerologyResult | null {
  try {
    const rawStr = numerologyJson == null ? "" : String(numerologyJson).trim();
    if (rawStr === "") return null;
    const raw = JSON.parse(rawStr) as unknown;
    const stored = normalizeNumerologyResult(raw);
    if (!stored) return null;

    const parts = parseOrderBirthDateParts(birthDateIso, birthDenorm ?? null);
    if (!parts) {
      return stored;
    }
    try {
      return refreshLifePathInNumerologyResult(stored, parts);
    } catch {
      return stored;
    }
  } catch {
    return null;
  }
}
