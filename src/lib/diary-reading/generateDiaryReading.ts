import { baseComments } from "./baseComments";
import {
  calendarDayAccents,
  calendarMonthAccents,
  specialOverlapAccents,
} from "./calendarAccents";
import { reduceToSingleDigit } from "./numerology";
import type { AccentTemplate, DiaryReadingInput } from "./types";

function hashSeed(parts: Array<string | number | undefined>): number {
  let seed = 0;
  for (const part of parts) {
    const s = String(part ?? "");
    for (let i = 0; i < s.length; i += 1) {
      seed = (seed * 31 + s.charCodeAt(i)) >>> 0;
    }
  }
  return seed;
}

function pickTemplate<T extends { id: string }>(
  candidates: T[],
  seed: number,
  recentTemplateIds?: string[],
): T | undefined {
  if (candidates.length === 0) return undefined;
  const recent = new Set(recentTemplateIds ?? []);
  const filtered = candidates.filter((item) => !recent.has(item.id));
  const source = filtered.length > 0 ? filtered : candidates;
  return source[seed % source.length];
}

function pickAccent(input: {
  baseTextLength: number;
  personalDay: number;
  monthNumber: number;
  dayNumber: number;
  seed: number;
  recentTemplateIds?: string[];
}): AccentTemplate | undefined {
  const { baseTextLength, personalDay, monthNumber, dayNumber, seed, recentTemplateIds } =
    input;

  if (
    personalDay === monthNumber ||
    personalDay === dayNumber ||
    monthNumber === dayNumber
  ) {
    const overlapCandidates = specialOverlapAccents.filter(
      (item) => item.number === personalDay || item.number === monthNumber,
    );
    const overlap = pickTemplate(overlapCandidates, seed + 17, recentTemplateIds);
    if (overlap) return overlap;
  }

  if (baseTextLength < 120) {
    const monthCandidates = calendarMonthAccents.filter(
      (item) => item.number === monthNumber,
    );
    const monthAccent = pickTemplate(monthCandidates, seed + 31, recentTemplateIds);
    if (monthAccent) return monthAccent;
  }

  if (baseTextLength < 160) {
    const dayCandidates = calendarDayAccents.filter((item) => item.number === dayNumber);
    return pickTemplate(dayCandidates, seed + 47, recentTemplateIds);
  }

  return undefined;
}

export function generateDiaryReading(input: DiaryReadingInput): {
  text: string;
  usedTemplateIds: string[];
} {
  const monthNumber = reduceToSingleDigit(input.calendarMonth);
  const dayNumber = reduceToSingleDigit(input.calendarDay);
  const seed = hashSeed([
    input.actionCategory,
    input.mood,
    input.personalYear,
    input.personalMonth,
    input.personalDay,
    input.calendarMonth,
    input.calendarDay,
  ]);

  const baseCandidates = baseComments.filter(
    (item) =>
      item.actionCategory === input.actionCategory &&
      item.personalDay === input.personalDay,
  );
  const base = pickTemplate(baseCandidates, seed, input.recentTemplateIds);

  if (!base) {
    return {
      text: "今日の記録には、あなたにしか分からない小さな意味があります。書き残したことそのものが、明日の自分への手紙になります。",
      usedTemplateIds: [],
    };
  }

  const accent = pickAccent({
    baseTextLength: base.text.length,
    personalDay: input.personalDay,
    monthNumber,
    dayNumber,
    seed,
    recentTemplateIds: input.recentTemplateIds,
  });

  return {
    text: [base.text, accent?.text].filter(Boolean).join("\n\n"),
    usedTemplateIds: [base.id, ...(accent ? [accent.id] : [])],
  };
}

export function collectTemplateIdsFromReadingText(text: string): string[] {
  if (!text.trim()) return [];
  const allTemplates = [...baseComments, ...calendarMonthAccents, ...calendarDayAccents, ...specialOverlapAccents];
  return allTemplates
    .filter((template) => text.includes(template.text))
    .map((template) => template.id);
}
