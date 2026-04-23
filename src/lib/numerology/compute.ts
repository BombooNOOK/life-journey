import type {
  BirthDateParts,
  BridgeNumbers,
  NumerologyInput,
  NumerologyResult,
} from "./types";
import { destinyFromRoman, personalityFromRoman, soulFromRoman } from "./name";
import { reduceToCoreNumber, sumDigits } from "./reduce";

/**
 * 楽天時代のバースデーナンバー: 生まれた「日」だけを使う。
 * - 11日 → 11、22日 → 22（マスターナンバーとしてそのまま）
 * - それ以外: 日を桁の和にし、1桁（1–9）になるまで縮約（途中の 11/22 もさらに足して 1 桁へ）
 */
function birthdayNumberFromDay(day: number): number {
  const d = Math.floor(Math.abs(day));
  if (d === 11) return 11;
  if (d === 22) return 22;
  let n = sumDigits(d);
  while (n > 9) {
    n = sumDigits(n);
  }
  return n;
}

/**
 * 楽天時代の仕様: 生年月日を YYYYMMDD の8桁として桁の和を取り、それを縮約してライフ・パスとする。
 *
 * 例: 1988-06-06 → 19880606 → 1+9+8+8+0+6+0+6 = 38 → 3+8 = 11
 */
export function ymdEightDigitSum(parts: BirthDateParts): {
  ymdString: string;
  digitSum: number;
} {
  const ymdString = `${parts.year}${String(parts.month).padStart(2, "0")}${String(parts.day).padStart(2, "0")}`;
  let digitSum = 0;
  for (const ch of ymdString) digitSum += Number(ch);
  return { ymdString, digitSum };
}

export function lifePathFromBirthDate(parts: BirthDateParts): number {
  return reduceToCoreNumber(ymdEightDigitSum(parts).digitSum);
}

/**
 * 保存済みの数秘スナップショットに、生年月日から現在ルールでライフ・パスとバースデーナンバーを再計算し、
 * LP に依存するブリッジ（LP–ディスティニー、バースデー–LP）を更新する。
 * （ディスティニー・ソウル・パーソナリティは stored のまま）
 */
export function refreshLifePathInNumerologyResult(
  stored: NumerologyResult,
  birthDate: BirthDateParts,
): NumerologyResult {
  const lifePathNumber = lifePathFromBirthDate(birthDate);
  const birthdayNumber = birthdayNumberFromBirthDate(birthDate);
  const bridges = buildBridgeNumbersFromCore({
    lifePath: lifePathNumber,
    destiny: stored.destinyNumber ?? null,
    soul: stored.soulNumber ?? null,
    personality: stored.personalityNumber ?? null,
    birthday: birthdayNumber,
  });
  return {
    ...stored,
    lifePathNumber,
    birthdayNumber,
    bridges,
  };
}

export function birthdayNumberFromBirthDate(parts: BirthDateParts): number {
  return birthdayNumberFromDay(parts.day);
}

export function bridgeBetween(a: number, b: number): number {
  const diff = Math.abs(a - b);
  if (diff === 0) return 9;
  return reduceToCoreNumber(diff);
}

/** コアナンバーからブリッジ10種を算出（保存 JSON の bridges を正規化するときにも使用） */
export function buildBridgeNumbersFromCore(params: {
  lifePath: number;
  destiny: number | null;
  soul: number | null;
  personality: number | null;
  birthday: number;
}): BridgeNumbers {
  const lp = params.lifePath;
  const bd = params.birthday;
  const dest = params.destiny;
  const soul = params.soul;
  const pers = params.personality;

  return {
    lifePathDestiny: dest != null ? bridgeBetween(lp, dest) : null,
    lifePathSoul: soul != null ? bridgeBetween(lp, soul) : null,
    lifePathPersonality: pers != null ? bridgeBetween(lp, pers) : null,
    birthdayLifePath: bridgeBetween(bd, lp),
    destinySoul:
      dest != null && soul != null ? bridgeBetween(dest, soul) : null,
    destinyPersonality:
      dest != null && pers != null ? bridgeBetween(dest, pers) : null,
    destinyBirthday: dest != null ? bridgeBetween(dest, bd) : null,
    soulPersonality:
      soul != null && pers != null ? bridgeBetween(soul, pers) : null,
    soulBirthday: soul != null ? bridgeBetween(soul, bd) : null,
    personalityBirthday: pers != null ? bridgeBetween(pers, bd) : null,
  };
}

export function computeNumerology(input: NumerologyInput): NumerologyResult {
  const lifePathNumber = lifePathFromBirthDate(input.birthDate);
  const birthdayNumber = birthdayNumberFromBirthDate(input.birthDate);

  let destinyNumber: number | null = null;
  let soulNumber: number | null = null;
  let personalityNumber: number | null = null;

  const name = input.romanName?.trim();
  if (name) {
    const d = destinyFromRoman(name);
    const so = soulFromRoman(name);
    const pe = personalityFromRoman(name);
    if (d > 0) destinyNumber = d;
    if (so > 0) soulNumber = so;
    if (pe > 0) personalityNumber = pe;
  }

  const bridges = buildBridgeNumbersFromCore({
    lifePath: lifePathNumber,
    destiny: destinyNumber,
    soul: soulNumber,
    personality: personalityNumber,
    birthday: birthdayNumber,
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
