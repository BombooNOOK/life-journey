import type { DailyNumberCoverSeason } from "./types";
import { DAILY_NUMBER_MESSAGES } from "./dailyNumberMessages";
import type { DailyNumberCoverVariant, DailyNumberTodayValue } from "./types";

/** 個別ページ文案の季節・行事テーマ（入稿データの season 列と対応） */
export const DAILY_NUMBER_MESSAGE_SEASON_MODES = ["base", "summer", "random"] as const;
export type DailyNumberMessageSeasonMode = (typeof DAILY_NUMBER_MESSAGE_SEASON_MODES)[number];

/** random 抽選の対象になりうる season（base 除く） */
export const DAILY_NUMBER_MESSAGE_SEASON_POOL: readonly DailyNumberCoverSeason[] = [
  "summer",
] as const;

export const DAILY_NUMBER_MESSAGE_SEASON_MODE_LABELS: Record<
  DailyNumberMessageSeasonMode,
  string
> = {
  base: "通常",
  summer: "夏の森",
  random: "ランダム（通常・季節）",
};

export const DAILY_NUMBER_MESSAGE_SEASON_LABELS: Record<DailyNumberCoverSeason, string> = {
  base: "通常",
  spring: "春",
  summer: "夏の森",
  autumn: "秋",
  winter: "冬",
};

export function isDailyNumberMessageSeasonMode(
  value: string,
): value is DailyNumberMessageSeasonMode {
  return (DAILY_NUMBER_MESSAGE_SEASON_MODES as readonly string[]).includes(value);
}

export function parseDailyNumberMessageSeasonMode(
  raw: string | null | undefined,
  fallback: DailyNumberMessageSeasonMode = "base",
): DailyNumberMessageSeasonMode {
  const value = String(raw ?? "").trim();
  return isDailyNumberMessageSeasonMode(value) ? value : fallback;
}

export function isDailyNumberMessageSeason(value: string): value is DailyNumberCoverSeason {
  return value in DAILY_NUMBER_MESSAGE_SEASON_LABELS;
}

export function hasDailyNumberMessageSeasonData(
  todayNumber: DailyNumberTodayValue,
  season: DailyNumberCoverSeason,
  variant: DailyNumberCoverVariant = "A",
): boolean {
  if (season === "base") return true;
  const count = DAILY_NUMBER_MESSAGES.filter(
    (m) =>
      m.todayNumber === todayNumber &&
      m.character === "owl" &&
      m.messageType === "base" &&
      (m.variant ?? "A") === variant &&
      m.season === season,
  ).length;
  return count >= 12;
}

export function listDailyNumberMessageSeasonsForRandom(
  todayNumber: DailyNumberTodayValue,
  variant: DailyNumberCoverVariant = "A",
): DailyNumberCoverSeason[] {
  const seasons: DailyNumberCoverSeason[] = ["base"];
  for (const season of DAILY_NUMBER_MESSAGE_SEASON_POOL) {
    if (hasDailyNumberMessageSeasonData(todayNumber, season, variant)) {
      seasons.push(season);
    }
  }
  return seasons;
}

export function pickRandomDailyNumberMessageSeason(
  todayNumber: DailyNumberTodayValue,
  variant: DailyNumberCoverVariant = "A",
): DailyNumberCoverSeason {
  const pool = listDailyNumberMessageSeasonsForRandom(todayNumber, variant);
  return pool[Math.floor(Math.random() * pool.length)] ?? "base";
}

/** 個別ページで実際に使う season（1投稿内で固定） */
export function resolveDailyNumberMessageSeason(input: {
  messageSeasonMode: DailyNumberMessageSeasonMode;
  todayNumber: DailyNumberTodayValue;
  variant: DailyNumberCoverVariant;
  lockedMessageSeason?: DailyNumberCoverSeason | null;
}): DailyNumberCoverSeason {
  if (input.messageSeasonMode === "base") return "base";
  if (input.messageSeasonMode === "summer") return "summer";
  if (
    input.lockedMessageSeason &&
    isDailyNumberMessageSeason(input.lockedMessageSeason) &&
    (input.lockedMessageSeason === "base" ||
      hasDailyNumberMessageSeasonData(input.todayNumber, input.lockedMessageSeason, input.variant))
  ) {
    return input.lockedMessageSeason;
  }
  return pickRandomDailyNumberMessageSeason(input.todayNumber, input.variant);
}

export function formatDailyNumberMessageSeasonUsageLabel(input: {
  messageSeasonMode: DailyNumberMessageSeasonMode;
  messageSeason: DailyNumberCoverSeason;
}): string {
  if (input.messageSeasonMode === "random") {
    return `個別文案：${DAILY_NUMBER_MESSAGE_SEASON_MODE_LABELS.random}（今回：${DAILY_NUMBER_MESSAGE_SEASON_LABELS[input.messageSeason]}）`;
  }
  return `個別文案：${DAILY_NUMBER_MESSAGE_SEASON_MODE_LABELS[input.messageSeasonMode]}`;
}

export function summerMessageSeasonRequiresVariantA(
  messageSeasonMode: DailyNumberMessageSeasonMode,
  variant: DailyNumberCoverVariant,
): boolean {
  return messageSeasonMode === "summer" && variant !== "A";
}
