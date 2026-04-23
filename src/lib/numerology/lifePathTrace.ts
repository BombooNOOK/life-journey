import type { BirthDateParts } from "./types";
import { ymdEightDigitSum, lifePathFromBirthDate } from "./compute";
import { reduceToCoreNumber, traceReductionToCore } from "./reduce";

/** 本採用（8桁全桁和）のトレース */
export interface LifePathEightDigitTrace {
  ymdString: string;
  digitSum: number;
  finalChain: number[];
  result: number;
}

/** 参考用: 月・日・年を分けて縮約してから足す方式のトレース */
export interface LifePathSplitReduceReferenceTrace {
  monthRaw: number;
  monthChain: number[];
  monthReduced: number;
  dayRaw: number;
  dayChain: number[];
  dayReduced: number;
  yearRaw: number;
  yearChain: number[];
  yearReduced: number;
  sumReducedParts: number;
  finalChain: number[];
  result: number;
}

export function traceLifePathFromBirthDate(parts: BirthDateParts): LifePathEightDigitTrace {
  const { ymdString, digitSum } = ymdEightDigitSum(parts);
  const finalChain = traceReductionToCore(digitSum);
  const result = lifePathFromBirthDate(parts);
  return { ymdString, digitSum, finalChain, result };
}

export function formatLifePathTraceJa(t: LifePathEightDigitTrace): string[] {
  return [
    `YYYYMMDD 連結: ${t.ymdString}`,
    `8桁の合計: ${t.digitSum}`,
    `縮約: ${t.finalChain.join(" → ")} → ライフ・パス ${t.result}`,
  ];
}

/** 旧比較・学習用（本採用ではない） */
export function traceLifePathSplitReduceReference(
  parts: BirthDateParts,
): LifePathSplitReduceReferenceTrace {
  const monthChain = traceReductionToCore(parts.month);
  const dayChain = traceReductionToCore(parts.day);
  const yearChain = traceReductionToCore(parts.year);
  const monthReduced = monthChain[monthChain.length - 1]!;
  const dayReduced = dayChain[dayChain.length - 1]!;
  const yearReduced = yearChain[yearChain.length - 1]!;
  const sumReducedParts = monthReduced + dayReduced + yearReduced;
  const finalChain = traceReductionToCore(sumReducedParts);
  const result = reduceToCoreNumber(sumReducedParts);
  return {
    monthRaw: parts.month,
    monthChain,
    monthReduced,
    dayRaw: parts.day,
    dayChain,
    dayReduced,
    yearRaw: parts.year,
    yearChain,
    yearReduced,
    sumReducedParts,
    finalChain,
    result,
  };
}

export function formatLifePathSplitReduceReferenceJa(
  t: LifePathSplitReduceReferenceTrace,
): string[] {
  const fmt = (label: string, raw: number, chain: number[]) =>
    `${label}: ${raw} → ${chain.join(" → ")}（縮約後 ${chain[chain.length - 1]}）`;
  return [
    fmt("月", t.monthRaw, t.monthChain),
    fmt("日", t.dayRaw, t.dayChain),
    fmt("年", t.yearRaw, t.yearChain),
    `縮約後の合計: ${t.monthReduced} + ${t.dayReduced} + ${t.yearReduced} = ${t.sumReducedParts}`,
    `最終縮約: ${t.sumReducedParts} → ${t.finalChain.join(" → ")} → 結果 ${t.result}`,
  ];
}

/** @deprecated compute.ymdEightDigitSum / lifePathFromBirthDate を利用 */
export function lifePathFromConcatenatedYmdDigits(parts: BirthDateParts): {
  ymdString: string;
  digitSum: number;
  result: number;
} {
  const { ymdString, digitSum } = ymdEightDigitSum(parts);
  return { ymdString, digitSum, result: reduceToCoreNumber(digitSum) };
}
