import { reduceToCoreNumber } from "./reduce";

/** 古典的ピタゴラス対応（A=1, B=2, … のグループではなく、縦列ルール） */
const LETTER_VALUES: Record<string, number> = (() => {
  const m: Record<string, number> = {};
  const rows: { letters: string[]; value: number }[] = [
    { letters: ["A", "J", "S"], value: 1 },
    { letters: ["B", "K", "T"], value: 2 },
    { letters: ["C", "L", "U"], value: 3 },
    { letters: ["D", "M", "V"], value: 4 },
    { letters: ["E", "N", "W"], value: 5 },
    { letters: ["F", "O", "X"], value: 6 },
    { letters: ["G", "P", "Y"], value: 7 },
    { letters: ["H", "Q", "Z"], value: 8 },
    { letters: ["I", "R"], value: 9 },
  ];
  for (const row of rows) {
    for (const ch of row.letters) m[ch] = row.value;
  }
  return m;
})();

const VOWELS = new Set(["A", "E", "I", "O", "U"]);

export function normalizeRomanName(raw: string): string {
  return raw
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z]/g, "");
}

function valueForLetter(ch: string): number {
  return LETTER_VALUES[ch] ?? 0;
}

/** フルネームの合計からディスティニー（エクスプレッション） */
export function destinyFromRoman(roman: string): number {
  const s = normalizeRomanName(roman);
  let total = 0;
  for (const ch of s) {
    total += valueForLetter(ch);
  }
  if (total === 0) return 0;
  return reduceToCoreNumber(total);
}

/** 母音のみ → ソウル */
export function soulFromRoman(roman: string): number {
  const s = normalizeRomanName(roman);
  let total = 0;
  for (const ch of s) {
    if (VOWELS.has(ch)) total += valueForLetter(ch);
  }
  if (total === 0) return 0;
  return reduceToCoreNumber(total);
}

/** 子音のみ → パーソナリティ（Y は子音扱い） */
export function personalityFromRoman(roman: string): number {
  const s = normalizeRomanName(roman);
  let total = 0;
  for (const ch of s) {
    if (!VOWELS.has(ch)) total += valueForLetter(ch);
  }
  if (total === 0) return 0;
  return reduceToCoreNumber(total);
}

export function rawNameTotals(roman: string): {
  fullSum: number;
  vowelSum: number;
  consonantSum: number;
} {
  const s = normalizeRomanName(roman);
  let fullSum = 0;
  let vowelSum = 0;
  let consonantSum = 0;
  for (const ch of s) {
    const v = valueForLetter(ch);
    fullSum += v;
    if (VOWELS.has(ch)) vowelSum += v;
    else consonantSum += v;
  }
  return { fullSum, vowelSum, consonantSum };
}
