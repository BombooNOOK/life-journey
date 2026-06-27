import { companionOptions } from "@/lib/journal/meta";

import {
  DAILY_NUMBER_MESSAGE_FALLBACK_CHARACTER,
  isDailyNumberDataReady,
  listDailyNumberMessages,
} from "./lookup";
import type {
  DailyNumberCharacter,
  DailyNumberCoverVariant,
  DailyNumberMessageType,
  DailyNumberTodayValue,
} from "./types";
import type { DailyNumberVariantMode } from "./variantMode";
import { resolveDailyNumberCoverVariant } from "./variantMode";

export type DailyNumberMessageSource = "exact" | "fallback_owl";

export function companionDisplayLabel(character: DailyNumberCharacter): string {
  return companionOptions.find((option) => option.id === character)?.label ?? character;
}

export function hasExactDailyNumberMessages(input: {
  todayNumber: DailyNumberTodayValue;
  character: DailyNumberCharacter;
  messageType: DailyNumberMessageType;
  variant: DailyNumberCoverVariant;
}): boolean {
  return (
    listDailyNumberMessages(
      {
        todayNumber: input.todayNumber,
        character: input.character,
        messageType: input.messageType,
        variant: input.variant,
      },
      { allowFallback: false },
    ).length >= 12
  );
}

export function getDailyNumberMessageSource(input: {
  todayNumber: DailyNumberTodayValue;
  character: DailyNumberCharacter;
  messageType: DailyNumberMessageType;
  variantMode: DailyNumberVariantMode;
  lockedVariant?: DailyNumberCoverVariant | null;
}): DailyNumberMessageSource {
  const variant = resolveDailyNumberCoverVariant({
    variantMode: input.variantMode,
    lockedVariant: input.lockedVariant,
  });
  return hasExactDailyNumberMessages({
    todayNumber: input.todayNumber,
    character: input.character,
    messageType: input.messageType,
    variant,
  })
    ? "exact"
    : "fallback_owl";
}

export function isDailyNumberPublishReady(input: {
  todayNumber: number | null;
  character: DailyNumberCharacter;
  messageType: DailyNumberMessageType;
  variantMode: DailyNumberVariantMode;
  lockedVariant?: DailyNumberCoverVariant | null;
}): boolean {
  if (input.todayNumber == null) return false;
  if (
    !isDailyNumberDataReady(
      input.todayNumber,
      input.character,
      input.messageType,
      input.variantMode,
    )
  ) {
    return false;
  }

  return (
    getDailyNumberMessageSource({
      todayNumber: input.todayNumber as DailyNumberTodayValue,
      character: input.character,
      messageType: input.messageType,
      variantMode: input.variantMode,
      lockedVariant: input.lockedVariant,
    }) === "exact"
  );
}

export function formatDailyNumberMessageFallbackNotice(character: DailyNumberCharacter): string {
  const selected = companionDisplayLabel(character);
  const fallback = companionDisplayLabel(DAILY_NUMBER_MESSAGE_FALLBACK_CHARACTER);
  return (
    `個別ページの文案は${fallback}のデータを仮表示しています（${selected}用の入稿がまだありません）。` +
    `表紙・説明・合成プレビューは確認できますが、保存とZIPダウンロードは${selected}の文案が揃うまでできません。`
  );
}

export function formatDailyNumberPublishBlockedError(character: DailyNumberCharacter): string {
  const selected = companionDisplayLabel(character);
  const fallback = companionDisplayLabel(DAILY_NUMBER_MESSAGE_FALLBACK_CHARACTER);
  return `${selected}用の個別ページ文案が未入稿のため、保存できません。プレビューのみ可能です（個別文案は${fallback}データを表示中）。`;
}
