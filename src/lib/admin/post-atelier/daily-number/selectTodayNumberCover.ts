import type {
  DailyNumberCoverSeason,
  DailyNumberCoverVariant,
  DailyNumberSpecialSeason,
  DailyNumberTodayValue,
  TodayNumberCoverSelection,
  TodayNumberCoverVariantRecord,
  TodayNumberMaster,
} from "./types";

function isFilledCover(row: TodayNumberCoverVariantRecord): boolean {
  return row.title.trim().length > 0 && row.summaryMessage.trim().length > 0;
}

function matchesVariant(
  row: TodayNumberCoverVariantRecord,
  variant: DailyNumberCoverVariant,
): boolean {
  return row.variant === variant;
}

function matchesSpecialSeason(
  row: TodayNumberCoverVariantRecord,
  specialSeason: DailyNumberSpecialSeason,
): boolean {
  return row.specialSeason === specialSeason;
}

function matchesSeason(
  row: TodayNumberCoverVariantRecord,
  season: DailyNumberCoverSeason,
): boolean {
  return row.season === season && !row.specialSeason;
}

function toMaster(row: TodayNumberCoverVariantRecord): TodayNumberMaster {
  return { ...row };
}

/**
 * 表紙文の選択。将来は specialSeason → season → base の順で fallback。
 * 現状は season / specialSeason 未指定時、base + variant（既定 A）を返す。
 */
export function selectTodayNumberCover(
  candidates: readonly TodayNumberCoverVariantRecord[],
  selection: TodayNumberCoverSelection,
): TodayNumberMaster | null {
  const variant = selection.variant ?? "A";
  const pool = candidates.filter(
    (row) => row.todayNumber === selection.todayNumber && isFilledCover(row),
  );
  if (pool.length === 0) return null;

  if (selection.specialSeason) {
    const hit = pool.find(
      (row) =>
        matchesSpecialSeason(row, selection.specialSeason!) &&
        matchesVariant(row, variant),
    );
    if (hit) return toMaster(hit);
  }

  if (selection.season && selection.season !== "base") {
    const hit = pool.find(
      (row) => matchesSeason(row, selection.season!) && matchesVariant(row, variant),
    );
    if (hit) return toMaster(hit);
  }

  const baseHit = pool.find(
    (row) => row.season === "base" && !row.specialSeason && matchesVariant(row, variant),
  );
  return baseHit ? toMaster(baseHit) : null;
}

/** 個別ページのおまもりカラー用。base variant A の colorName を基準にする。 */
export function getTodayNumberColorName(
  candidates: readonly TodayNumberCoverVariantRecord[],
  todayNumber: DailyNumberTodayValue,
): string | null {
  const cover = selectTodayNumberCover(candidates, { todayNumber, variant: "A" });
  return cover?.colorName ?? null;
}

export function hasTodayNumberBaseCover(
  candidates: readonly TodayNumberCoverVariantRecord[],
  todayNumber: DailyNumberTodayValue,
  variant: DailyNumberCoverVariant = "A",
): boolean {
  return selectTodayNumberCover(candidates, { todayNumber, variant }) != null;
}
