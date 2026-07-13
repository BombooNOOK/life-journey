import { getBirthdayArticle } from "@/lib/numerology/birthdayData";
import { getDestinyArticle } from "@/lib/numerology/destinyData";
import { getLifePathArticle } from "@/lib/numerology/lifePathData";
import { getMaturityArticle } from "@/lib/numerology/maturityData";
import { getPersonalityArticle } from "@/lib/numerology/personalityData";
import { getSoulArticle } from "@/lib/numerology/soulData";
import { personalYearCycleEntry } from "@/lib/numerology/data/personalYearCycleData";
import { personalYearNumber } from "@/lib/numerology/personalYearMonth";
import { maturityNumberFromNumerology } from "@/lib/numerology/reduce";
import type { NumerologyResult } from "@/lib/numerology/types";

export type KanteiHallNumberRow = {
  id: string;
  label: string;
  value: number | null;
  /** 年付き表示（パーソナルイヤー用） */
  yearLabel?: string;
  message: string;
};

export type KanteiHallSummary = {
  coreRows: KanteiHallNumberRow[];
  maturityRow: KanteiHallNumberRow;
  personalYearRow: KanteiHallNumberRow;
};

function messageOrFallback(message: string | null | undefined, fallback: string): string {
  const trimmed = message?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

/** 鑑定のへや：数字＋短いメッセージの一覧を組み立てる */
export function buildKanteiHallSummary(input: {
  numerology: NumerologyResult;
  birthMonth: number;
  birthDay: number;
  referenceDate?: Date;
}): KanteiHallSummary {
  const { numerology, birthMonth, birthDay } = input;
  const now = input.referenceDate ?? new Date();
  const calendarYear = now.getFullYear();
  const maturity = maturityNumberFromNumerology(numerology);
  const yearCycle = personalYearNumber(birthMonth, birthDay, calendarYear);
  const yearTheme = personalYearCycleEntry(yearCycle);

  const coreRows: KanteiHallNumberRow[] = [
    {
      id: "lifePath",
      label: "ライフパス",
      value: numerology.lifePathNumber,
      message: messageOrFallback(
        getLifePathArticle(numerology.lifePathNumber)?.title,
        "生まれ持った性質を映す数字です。",
      ),
    },
    {
      id: "destiny",
      label: "ディスティニー",
      value: numerology.destinyNumber,
      message: messageOrFallback(
        getDestinyArticle(numerology.destinyNumber)?.title,
        "社会での役割を映す数字です。",
      ),
    },
    {
      id: "soul",
      label: "ソウル",
      value: numerology.soulNumber,
      message: messageOrFallback(
        getSoulArticle(numerology.soulNumber)?.title,
        "心の奥の願いを映す数字です。",
      ),
    },
    {
      id: "personality",
      label: "パーソナリティ",
      value: numerology.personalityNumber,
      message: messageOrFallback(
        getPersonalityArticle(numerology.personalityNumber)?.title,
        "第一印象の魅力を映す数字です。",
      ),
    },
    {
      id: "birthday",
      label: "バースデー",
      value: numerology.birthdayNumber,
      message: messageOrFallback(
        getBirthdayArticle(numerology.birthdayNumber)?.strength,
        "人生のギフトを映す数字です。",
      ),
    },
  ];

  return {
    coreRows,
    maturityRow: {
      id: "maturity",
      label: "マチュリティ",
      value: maturity,
      message: messageOrFallback(
        getMaturityArticle(maturity)?.title,
        "成熟していく方向を映す数字です。",
      ),
    },
    personalYearRow: {
      id: "personalYear",
      label: "パーソナルイヤー",
      value: yearCycle,
      yearLabel: `${calendarYear}年`,
      message: [yearTheme.theme, yearTheme.subtitle.replace(/\n/g, " ")].filter(Boolean).join(" — "),
    },
  };
}
