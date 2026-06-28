import type {
  DailyNumberCharacter,
  DailyNumberCoverSeason,
  DailyNumberCoverVariant,
  DailyNumberMessage,
  DailyNumberMessageType,
  DailyNumberTodayValue,
} from "./types";

export type DailyNumberMessageSelection = {
  todayNumber: DailyNumberTodayValue;
  character: DailyNumberCharacter;
  messageType: DailyNumberMessageType;
  variant?: DailyNumberCoverVariant;
  season?: DailyNumberCoverSeason;
};

function matchesVariant(
  message: DailyNumberMessage,
  variant: DailyNumberCoverVariant,
): boolean {
  return (message.variant ?? "A") === variant;
}

function matchesSeason(message: DailyNumberMessage, season: DailyNumberCoverSeason): boolean {
  return (message.season ?? "base") === season;
}

function filterPool(
  candidates: readonly DailyNumberMessage[],
  selection: DailyNumberMessageSelection,
  character: DailyNumberCharacter,
): DailyNumberMessage[] {
  const variant = selection.variant ?? "A";
  return candidates.filter(
    (m) =>
      m.todayNumber === selection.todayNumber &&
      m.character === character &&
      m.messageType === selection.messageType &&
      matchesVariant(m, variant),
  );
}

/**
 * 個別メッセージの選択。season 一致 → base fallback。
 * summer 等は variant A のみ入稿想定。B/C は base を使う。
 */
export function selectDailyNumberMessages(
  candidates: readonly DailyNumberMessage[],
  selection: DailyNumberMessageSelection,
  options?: { allowFallback?: boolean; fallbackCharacter?: DailyNumberCharacter },
): DailyNumberMessage[] {
  const variant = selection.variant ?? "A";
  const allowFallback = options?.allowFallback ?? true;
  const fallbackCharacter = options?.fallbackCharacter ?? "owl";

  const pickForCharacter = (character: DailyNumberCharacter): DailyNumberMessage[] => {
    const pool = filterPool(candidates, selection, character);
    if (pool.length === 0) return [];

    if (selection.season && selection.season !== "base") {
      const seasonal = pool.filter((m) => matchesSeason(m, selection.season!));
      if (seasonal.length >= 12) return seasonal;
    }

    return pool.filter((m) => matchesSeason(m, "base"));
  };

  const exact = pickForCharacter(selection.character);
  if (exact.length > 0) return exact;

  if (!allowFallback || selection.character === fallbackCharacter) {
    return exact;
  }

  return pickForCharacter(fallbackCharacter);
}
