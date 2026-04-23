import type { NumerologyResult } from "./types";

/**
 * ピタゴラス式: 各桁を足して 1–9 またはマスター 11/22/33 まで縮約
 */
export function sumDigits(n: number): number {
  let s = 0;
  let x = Math.abs(Math.floor(n));
  while (x > 0) {
    s += x % 10;
    x = Math.floor(x / 10);
  }
  return s;
}

export function reduceToCoreNumber(value: number): number {
  let n = Math.abs(Math.floor(value));
  if (n === 0) return 0;
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = sumDigits(n);
  }
  return n;
}

/**
 * reduceToCoreNumber と同じルールで、縮約の途中経過（各ステップの数）を返す。検証・説明用。
 */
export function traceReductionToCore(value: number): number[] {
  let n = Math.abs(Math.floor(value));
  const chain: number[] = [];
  if (n === 0) return [0];
  chain.push(n);
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = sumDigits(n);
    chain.push(n);
  }
  return chain;
}

/**
 * マチュリティナンバー専用ルール。
 * - maturity = lifePath + destiny
 * - 合計が 11 / 22 のときはそのまま保持
 * - 33 はマスターナンバーとして扱わず縮約
 * - それ以外は 1 桁になるまで縮約
 */
export function maturityNumberFromCore(lifePath: number, destiny: number): number {
  let n = Math.abs(Math.floor(lifePath)) + Math.abs(Math.floor(destiny));
  if (n === 11 || n === 22) return n;
  while (n > 9) {
    n = sumDigits(n);
  }
  return n;
}

/** ディスティニーが算出できないときはマチュリティも算出しない */
export function maturityNumberFromNumerology(
  result: Pick<NumerologyResult, "lifePathNumber" | "destinyNumber">,
): number | null {
  if (result.destinyNumber == null) return null;
  return maturityNumberFromCore(result.lifePathNumber, result.destinyNumber);
}
