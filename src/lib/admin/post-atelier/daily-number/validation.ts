import { companionTypes, isCompanionType } from "@/lib/journal/meta";

import { universalDayForScheduledDate } from "@/lib/admin/post-atelier/universalDayForScheduledDate";
import {
  SOCIAL_POST_DRAFT_STATUSES,
  type SocialPostDraftStatus,
} from "@/lib/admin/post-atelier/types";
import {
  DAILY_NUMBER_MESSAGE_TYPES,
  type DailyNumberCoverVariant,
  type DailyNumberMessageType,
} from "./types";
import { normalizeDailyNumberCharacter } from "./resolveDailyNumberPost";
import {
  isDailyNumberCoverVariant,
  parseDailyNumberVariantMode,
  type DailyNumberVariantMode,
} from "./variantMode";
import {
  isDailyNumberClosingVariant,
  type DailyNumberClosingVariant,
} from "./closingVariant";
import {
  isDailyNumberMessageSeason,
  parseDailyNumberMessageSeasonMode,
  type DailyNumberMessageSeasonMode,
} from "./messageSeasonMode";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function trimOrEmpty(value: FormDataEntryValue | null | undefined): string {
  return String(value ?? "").trim();
}

function parseStatus(raw: string): SocialPostDraftStatus {
  if ((SOCIAL_POST_DRAFT_STATUSES as readonly string[]).includes(raw)) {
    return raw as SocialPostDraftStatus;
  }
  return "draft";
}

function parseMessageType(raw: string): DailyNumberMessageType {
  if ((DAILY_NUMBER_MESSAGE_TYPES as readonly string[]).includes(raw as DailyNumberMessageType)) {
    return raw as DailyNumberMessageType;
  }
  return "base";
}

export type ParseDailyNumberDraftResult =
  | {
      ok: true;
      data: {
        scheduledDate: string;
        companionType: ReturnType<typeof normalizeDailyNumberCharacter>;
        messageType: DailyNumberMessageType;
        coverVariantMode: DailyNumberVariantMode;
        messageSeasonMode: DailyNumberMessageSeasonMode;
        lockedVariant: DailyNumberCoverVariant | null;
        lockedMessageSeason: import("./types").DailyNumberCoverSeason | null;
        lockedClosingVariant: DailyNumberClosingVariant | null;
        status: SocialPostDraftStatus;
        internalMemo: string;
        todayNumber: number | null;
      };
    }
  | { ok: false; error: string };

function parseLockedVariant(
  raw: string,
  coverVariantMode: DailyNumberVariantMode,
): DailyNumberCoverVariant | null {
  if (coverVariantMode !== "random") return null;
  if (!raw || !isDailyNumberCoverVariant(raw)) return null;
  return raw;
}

function parseLockedClosingVariant(raw: string): DailyNumberClosingVariant | null {
  if (!raw || !isDailyNumberClosingVariant(raw)) return null;
  return raw;
}

function parseLockedMessageSeason(
  raw: string,
  messageSeasonMode: DailyNumberMessageSeasonMode,
): import("./types").DailyNumberCoverSeason | null {
  if (messageSeasonMode !== "random") return null;
  if (!raw || !isDailyNumberMessageSeason(raw)) return null;
  return raw;
}

export function parseDailyNumberDraftFormData(formData: FormData): ParseDailyNumberDraftResult {
  const scheduledDate = trimOrEmpty(formData.get("scheduledDate"));
  const companionType = normalizeDailyNumberCharacter(trimOrEmpty(formData.get("companionType")));
  const messageType = parseMessageType(trimOrEmpty(formData.get("messageType")) || "base");
  const coverVariantMode = parseDailyNumberVariantMode(trimOrEmpty(formData.get("coverVariantMode")));
  const messageSeasonMode = parseDailyNumberMessageSeasonMode(
    trimOrEmpty(formData.get("messageSeasonMode")),
  );
  const lockedVariant = parseLockedVariant(
    trimOrEmpty(formData.get("resolvedVariant")),
    coverVariantMode,
  );
  const lockedMessageSeason = parseLockedMessageSeason(
    trimOrEmpty(formData.get("lockedMessageSeason")),
    messageSeasonMode,
  );
  const lockedClosingVariant = parseLockedClosingVariant(
    trimOrEmpty(formData.get("resolvedClosingVariant")),
  );
  const status = parseStatus(trimOrEmpty(formData.get("status")));
  const internalMemo = trimOrEmpty(formData.get("internalMemo"));

  if (!scheduledDate) {
    return { ok: false, error: "投稿予定日を入力してください。" };
  }
  if (!DATE_RE.test(scheduledDate)) {
    return { ok: false, error: "予定日は YYYY-MM-DD 形式で入力してください。" };
  }
  if (!isCompanionType(companionType) || !companionTypes.includes(companionType)) {
    return { ok: false, error: "キャラの指定が不正です。" };
  }

  const todayNumber = universalDayForScheduledDate(scheduledDate);

  return {
    ok: true,
    data: {
      scheduledDate,
      companionType,
      messageType,
      coverVariantMode,
      messageSeasonMode,
      lockedVariant,
      lockedMessageSeason,
      lockedClosingVariant,
      status,
      internalMemo,
      todayNumber,
    },
  };
}
