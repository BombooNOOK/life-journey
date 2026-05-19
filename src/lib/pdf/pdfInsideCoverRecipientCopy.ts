import type { CustomerFormValues } from "@/lib/order/types";
import { romanizeFromKanaParts } from "@/lib/numerology/kanaToRomaji";

function titleCaseRomanWord(word: string): string {
  const w = word.trim();
  if (!w) return "";
  const lower = w.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * 数秘計算に使うローマ字と同じ変換（ふりがな→ヘボン式）から、中表紙用 Western 表記（名→姓）を得る。
 *
 * - 計算入力: `romanNameForNumerology` = `[lastNameRoman, firstNameRoman].join(" ")`（姓→名・大文字）
 * - DB: `lastNameRoman` / `firstNameRoman` がそのまま各パーツ、`fullNameRomanDisplay` は上記 join と一致
 */
export function numerologyRomanWesternDisplayName(
  customer: Pick<
    CustomerFormValues,
    | "lastNameKana"
    | "firstNameKana"
    | "lastNameRoman"
    | "firstNameRoman"
    | "fullNameRomanDisplay"
    | "fullNameDisplay"
    | "fullNameKanaDisplay"
  >,
): string | null {
  const firstStored = customer.firstNameRoman?.trim();
  const lastStored = customer.lastNameRoman?.trim();
  if (firstStored || lastStored) {
    return [firstStored, lastStored].filter(Boolean).map(titleCaseRomanWord).join(" ");
  }

  const lastKana = customer.lastNameKana?.trim() ?? "";
  const firstKana = customer.firstNameKana?.trim() ?? "";
  if (lastKana || firstKana) {
    const romanized = romanizeFromKanaParts(lastKana, firstKana);
    const first = romanized.firstNameRoman?.trim();
    const last = romanized.lastNameRoman?.trim();
    if (first || last) {
      return [first, last].filter(Boolean).map(titleCaseRomanWord).join(" ");
    }
  }

  const numerologyJoin = customer.fullNameRomanDisplay?.trim();
  if (numerologyJoin) {
    const words = numerologyJoin.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      const lastWord = words[0];
      const firstWord = words[1];
      return [firstWord, lastWord].filter(Boolean).map(titleCaseRomanWord).join(" ");
    }
    return titleCaseRomanWord(numerologyJoin);
  }

  const display = customer.fullNameDisplay?.trim();
  if (display) return display;

  const kana = customer.fullNameKanaDisplay?.trim();
  if (kana) return kana;

  return null;
}

/** 中表紙の "for …" 行（鑑定用ヘボン式ローマ字・Western 表記） */
export function formatInsideCoverForName(
  customer: Parameters<typeof numerologyRomanWesternDisplayName>[0],
): string | null {
  const name = numerologyRomanWesternDisplayName(customer);
  return name ? `for ${name}` : null;
}

const EN_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** 例: Born on July 12, 2025 */
export function formatInsideCoverBornLine(
  customer: Pick<CustomerFormValues, "birthYear" | "birthMonth" | "birthDay" | "birthDate">,
): string | null {
  let year = customer.birthYear;
  let month = customer.birthMonth;
  let day = customer.birthDay;

  if (!year || !month || !day) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(customer.birthDate?.trim() ?? "");
    if (!m) return null;
    year = Number(m[1]);
    month = Number(m[2]);
    day = Number(m[3]);
  }

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const monthName = EN_MONTHS[month - 1];
  return `Born on ${monthName} ${day}, ${year}`;
}
