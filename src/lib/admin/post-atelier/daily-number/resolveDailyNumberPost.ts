import type { CompanionType } from "@/lib/journal/meta";

import { buildCanvaCopyText, buildInstagramCaption } from "./buildCopyText";
import {
  buildDailyNumberGeneratedPayload,
  isDailyNumberDataReady,
} from "./lookup";
import {
  getDailyNumberMessageSource,
  isDailyNumberPublishReady,
} from "./messagePublishPolicy";
import type {
  DailyNumberCharacter,
  DailyNumberClosingVariant,
  DailyNumberCoverVariant,
  DailyNumberLookupResult,
  DailyNumberMessageType,
  DailyNumberTodayValue,
} from "./types";
import type { DailyNumberVariantMode } from "./variantMode";

export function resolveDailyNumberPost(input: {
  scheduledDate: string;
  todayNumber: number | null;
  character: DailyNumberCharacter;
  messageType: DailyNumberMessageType;
  coverVariantMode?: DailyNumberVariantMode;
  lockedVariant?: DailyNumberCoverVariant | null;
  lockedClosingVariant?: DailyNumberClosingVariant | null;
}): DailyNumberLookupResult {
  const variantMode = input.coverVariantMode ?? "A";

  if (!isDailyNumberDataReady(input.todayNumber, input.character, input.messageType, variantMode)) {
    return {
      ok: false,
      reason: "data_not_ready",
      todayNumber: input.todayNumber,
      character: input.character,
      messageType: input.messageType,
    };
  }

  const payload = buildDailyNumberGeneratedPayload({
    scheduledDate: input.scheduledDate,
    todayNumber: input.todayNumber as DailyNumberTodayValue,
    character: input.character,
    messageType: input.messageType,
    variantMode,
    lockedVariant: input.lockedVariant,
    lockedClosingVariant: input.lockedClosingVariant,
  });

  if (!payload) {
    return {
      ok: false,
      reason: "data_not_ready",
      todayNumber: input.todayNumber,
      character: input.character,
      messageType: input.messageType,
    };
  }

  return {
    ok: true,
    payload,
    canvaCopyText: buildCanvaCopyText(payload),
    captionText: buildInstagramCaption(payload),
    messageSource: getDailyNumberMessageSource({
      todayNumber: payload.todayNumber,
      character: payload.character,
      messageType: payload.messageType,
      variantMode: payload.variantMode,
      lockedVariant: payload.variantMode === "random" ? payload.variant : null,
    }),
    publishReady: isDailyNumberPublishReady({
      todayNumber: payload.todayNumber,
      character: payload.character,
      messageType: payload.messageType,
      variantMode: payload.variantMode,
      lockedVariant: payload.variantMode === "random" ? payload.variant : null,
    }),
  };
}

export function normalizeDailyNumberCharacter(raw: string): CompanionType {
  const value = raw.trim();
  if (value === "kerosion") return "frog";
  const allowed: CompanionType[] = ["owl", "hedgehog", "squirrel", "frog", "sloth"];
  return allowed.includes(value as CompanionType) ? (value as CompanionType) : "owl";
}
