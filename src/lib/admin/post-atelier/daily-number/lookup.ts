import type {
  DailyNumberCharacter,
  DailyNumberCoverVariant,
  DailyNumberGeneratedPayload,
  DailyNumberMessage,
  DailyNumberMessageType,
  DailyNumberPagePreview,
  DailyNumberTodayValue,
  PersonalNumberMaster,
  TodayNumberCoverSelection,
  TodayNumberMaster,
} from "./types";
import { DAILY_NUMBER_MESSAGES, TODAY_NUMBER_COVER_VARIANTS } from "./dailyNumberMessages";
import { PERSONAL_NUMBER_MASTERS } from "./personalNumberMasters";
import { DAILY_NUMBER_PERSONAL_PAGE_GROUPS, DAILY_NUMBER_SERIES_TITLE } from "./pageLayout";
import {
  getTodayNumberColorName,
  hasTodayNumberBaseCover,
  selectTodayNumberCover,
} from "./selectTodayNumberCover";
import type { DailyNumberVariantMode } from "./variantMode";
import { resolveDailyNumberCoverVariant } from "./variantMode";
import type { DailyNumberClosingVariant } from "./closingVariant";
import { resolveDailyNumberClosingVariant } from "./closingVariant";

export { selectTodayNumberCover, getTodayNumberColorName, hasTodayNumberBaseCover };

function variantsToValidate(variantMode: DailyNumberVariantMode): DailyNumberCoverVariant[] {
  return variantMode === "random" ? ["A", "B", "C"] : [variantMode];
}

export function isDailyNumberDataReady(
  todayNumber: number | null,
  character: DailyNumberCharacter,
  messageType: DailyNumberMessageType,
  variantMode: DailyNumberVariantMode = "A",
): boolean {
  if (todayNumber == null) return false;
  if (character !== "owl" || messageType !== "base") return false;

  return variantsToValidate(variantMode).every((variant) => {
    if (!hasTodayNumberBaseCover(TODAY_NUMBER_COVER_VARIANTS, todayNumber as DailyNumberTodayValue, variant)) {
      return false;
    }
    return (
      listDailyNumberMessages({
        todayNumber: todayNumber as DailyNumberTodayValue,
        character,
        messageType,
        variant,
      }).length >= 12
    );
  });
}

export function getTodayNumberMaster(
  todayNumber: DailyNumberTodayValue,
  selection?: Omit<TodayNumberCoverSelection, "todayNumber">,
): TodayNumberMaster | null {
  return selectTodayNumberCover(TODAY_NUMBER_COVER_VARIANTS, {
    todayNumber,
    ...selection,
  });
}

export function getPersonalNumberMaster(
  lifePathNumber: number,
): PersonalNumberMaster | null {
  return PERSONAL_NUMBER_MASTERS.find((m) => m.lifePathNumber === lifePathNumber) ?? null;
}

export function listDailyNumberMessages(input: {
  todayNumber: DailyNumberTodayValue;
  character: DailyNumberCharacter;
  messageType: DailyNumberMessageType;
  variant?: DailyNumberCoverVariant;
}): DailyNumberMessage[] {
  const variant = input.variant ?? "A";
  return DAILY_NUMBER_MESSAGES.filter(
    (m) =>
      m.todayNumber === input.todayNumber &&
      m.character === input.character &&
      m.messageType === input.messageType &&
      (m.variant ?? "A") === variant,
  );
}

function findMessage(
  messages: DailyNumberMessage[],
  lifePathNumber: number,
): DailyNumberMessage | null {
  return messages.find((m) => m.lifePathNumber === lifePathNumber) ?? null;
}

export function buildDailyNumberPages(
  messages: DailyNumberMessage[],
): DailyNumberPagePreview[] {
  return DAILY_NUMBER_PERSONAL_PAGE_GROUPS.map((group, pageIndex) => ({
    pageIndex,
    blocks: group
      .map((lp) => findMessage(messages, lp))
      .filter((m): m is DailyNumberMessage => m != null),
  }));
}

export function buildDailyNumberGeneratedPayload(input: {
  scheduledDate: string;
  todayNumber: DailyNumberTodayValue;
  character: DailyNumberCharacter;
  messageType: DailyNumberMessageType;
  variantMode: DailyNumberVariantMode;
  lockedVariant?: DailyNumberCoverVariant | null;
  lockedClosingVariant?: DailyNumberClosingVariant | null;
}): DailyNumberGeneratedPayload | null {
  const variant = resolveDailyNumberCoverVariant({
    variantMode: input.variantMode,
    lockedVariant: input.lockedVariant,
  });
  const closingVariant = resolveDailyNumberClosingVariant({
    lockedClosingVariant: input.lockedClosingVariant,
  });

  const cover = getTodayNumberMaster(input.todayNumber, { variant });
  if (!cover) return null;

  const messages = listDailyNumberMessages({
    todayNumber: input.todayNumber,
    character: input.character,
    messageType: input.messageType,
    variant,
  });
  if (messages.length === 0) return null;

  const pages = buildDailyNumberPages(messages);
  if (pages.some((p) => p.blocks.length < 1)) return null;

  return {
    postType: "daily_number",
    scheduledDate: input.scheduledDate,
    todayNumber: input.todayNumber,
    character: input.character,
    messageType: input.messageType,
    variantMode: input.variantMode,
    variant,
    closingVariant,
    seriesTitle: DAILY_NUMBER_SERIES_TITLE,
    cover,
    pages,
    generatedAt: new Date().toISOString(),
  };
}

function normalizeLegacyPayload(parsed: DailyNumberGeneratedPayload): DailyNumberGeneratedPayload {
  const variant =
    parsed.variant ??
    parsed.cover?.variant ??
    ("A" as DailyNumberCoverVariant);
  const variantMode = parsed.variantMode ?? variant;
  const closingVariant =
    parsed.closingVariant ?? ("diary_entry" as DailyNumberClosingVariant);
  return {
    ...parsed,
    variantMode,
    variant,
    closingVariant,
    cover: { ...parsed.cover, variant },
  };
}

export function parseDailyNumberGeneratedPayload(
  raw: string | null | undefined,
): DailyNumberGeneratedPayload | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as DailyNumberGeneratedPayload;
    if (parsed?.postType !== "daily_number") return null;
    if (!parsed.cover || !Array.isArray(parsed.pages)) return null;
    return normalizeLegacyPayload(parsed);
  } catch {
    return null;
  }
}
