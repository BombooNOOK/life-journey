import {
  type BridgeProfile,
  type BridgeProfileRow,
  SCORE_LABEL_BY_PERCENT,
  bridgeProfiles,
} from "./bridgeProfiles";
import { sumDigits } from "./reduce";
import type { NumerologyResult } from "./types";

/** LP / D を 1 桁（1–9）に揃える（pairKey 用。11→2, 22→4 …） */
export function normalizeDigitForBridgePair(n: number): number {
  let x = Math.abs(Math.floor(n));
  while (x > 9) {
    x = sumDigits(x);
  }
  return x === 0 ? 9 : x;
}

/**
 * 任意の 2 コアナンバーから pairKey（bridgeProfiles のキー）を作る。
 * 大きい桁を先・小さい桁を後（例: 9 と 1 → "91"）。同値は "00"。
 * LP×D に限らず全ブリッジペアで共通。
 */
export function pairKeyFromTwoCoreNumbers(a: number, b: number): string {
  const x = normalizeDigitForBridgePair(a);
  const y = normalizeDigitForBridgePair(b);
  if (x === y) return "00";
  const hi = Math.max(x, y);
  const lo = Math.min(x, y);
  return `${hi}${lo}`;
}

/** LP×D 向けの別名。実体は {@link pairKeyFromTwoCoreNumbers} と同じ。 */
export function pairKeyFromLifePathAndDestiny(lifePath: number, destiny: number): string {
  return pairKeyFromTwoCoreNumbers(lifePath, destiny);
}

const STARS_BY_PERCENT: Record<number, string> = {
  20: "★☆☆☆☆",
  40: "★★☆☆☆",
  60: "★★★☆☆",
  80: "★★★★☆",
  100: "★★★★★",
};

/** PDF 等で Unicode 星が欠ける場合の同順フォールバック（必ず非空） */
const STARS_ASCII_BY_PERCENT: Record<number, string> = {
  20: "*····",
  40: "**···",
  60: "***··",
  80: "****·",
  100: "*****",
};

const STAR_STEPS = [20, 40, 60, 80, 100] as const;

function nearestStarStep(p: number): number {
  return STAR_STEPS.reduce((best, s) =>
    Math.abs(s - p) < Math.abs(best - p) ? s : best,
  );
}

/**
 * 一致度パーセントから星 5 段階の文字列を返す（常に非空）。
 * 登録の 20/40/60/80/100 以外は最も近い段階に寄せる。
 * Unicode（★☆）を優先し、PDF フォントで欠ける場合に備え ASCII 版へフォールバック。
 */
export function bridgeStarsFromScorePercent(scorePercent: number): string {
  const p = Math.round(Number(scorePercent));
  const step = STARS_BY_PERCENT[p] != null ? p : nearestStarStep(p);
  return (
    STARS_BY_PERCENT[step] ?? STARS_ASCII_BY_PERCENT[step] ?? "*****"
  );
}

/** PDF 用: 星・％・段階数を分解（Helvetica / Courier 用テキストと併用） */
export type BridgeAgreementPdfParts = {
  /** 左から「埋まった数」分だけ ★（Unicode） */
  unicodeStars: string;
  /** 同じ段階の ASCII（必ず可視） */
  asciiStars: string;
  /** データ上の一致度％（表示用） */
  percentShown: number;
  /** 星 5 個のうち「埋まり」側の個数（1〜5） */
  filledOf5: number;
};

export function bridgeAgreementPdfParts(scorePercent: number): BridgeAgreementPdfParts {
  const percentShown = Math.round(Number(scorePercent));
  const step = STARS_BY_PERCENT[percentShown] != null ? percentShown : nearestStarStep(percentShown);
  const filledOf5 = step / 20;
  const unicodeStars = bridgeStarsFromScorePercent(percentShown);
  const asciiStars =
    STARS_ASCII_BY_PERCENT[step] ??
    STARS_ASCII_BY_PERCENT[nearestStarStep(percentShown)] ??
    "*****";
  return { unicodeStars, asciiStars, percentShown, filledOf5 };
}

export function scoreLabelFromPercent(scorePercent: number): string | null {
  return SCORE_LABEL_BY_PERCENT[scorePercent] ?? null;
}

/**
 * pairKey で本文行を引く。表示用の bridgeNumber はデータ行の値（原稿と一致）。
 */
export function getBridgeProfile(pairKey: string): BridgeProfile | null {
  const row = bridgeProfiles[pairKey];
  if (!row) return null;
  return {
    bridgeNumber: row.bridgeNumber,
    pairKey: row.pairKey,
    scorePercent: row.scorePercent,
    scoreLabel: row.scoreLabel,
    article: row.article,
  };
}

export function getBridgeProfileRow(pairKey: string): BridgeProfileRow | null {
  return bridgeProfiles[pairKey] ?? null;
}

/**
 * 数秘結果から LP–D ブリッジの表示用プロファイルを組み立てる。
 * ディスティニーまたは `lifePathDestiny` ブリッジが無いときは null。
 */
export function resolveLifePathDestinyBridgeProfile(
  numerology: Pick<NumerologyResult, "lifePathNumber" | "destinyNumber" | "bridges">,
): BridgeProfile | null {
  const d = numerology.destinyNumber;
  if (d == null) return null;
  const computedBridge = numerology.bridges.lifePathDestiny;
  if (computedBridge == null) return null;
  const pairKey = pairKeyFromTwoCoreNumbers(numerology.lifePathNumber, d);
  return getBridgeProfile(pairKey);
}

/** PDF 用: D があるときは数値・pairKey まで必ず返し、`profile` は `bridgeProfiles` に行があるときだけ */
export type LifePathDestinyBridgeForPdf = {
  lifePathNumber: number;
  destinyNumber: number;
  bridgeNumber: number;
  pairKey: string;
  profile: BridgeProfile | null;
};

export function lifePathDestinyBridgeForPdf(
  numerology: Pick<NumerologyResult, "lifePathNumber" | "destinyNumber" | "bridges">,
): LifePathDestinyBridgeForPdf | null {
  const d = numerology.destinyNumber;
  if (d == null) return null;
  const computedBridge = numerology.bridges.lifePathDestiny;
  if (computedBridge == null) return null;
  const pairKey = pairKeyFromTwoCoreNumbers(numerology.lifePathNumber, d);
  const profile = getBridgeProfile(pairKey);
  /** プロファイルがあるときは原稿の bridgeNumber を優先（本文・一致度と揃える） */
  const bridgeNumber = profile?.bridgeNumber ?? computedBridge;
  return {
    lifePathNumber: numerology.lifePathNumber,
    destinyNumber: d,
    bridgeNumber,
    pairKey,
    profile,
  };
}
