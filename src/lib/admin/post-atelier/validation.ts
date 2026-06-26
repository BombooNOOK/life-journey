import { companionTypes, isCompanionType } from "@/lib/journal/meta";

import { universalDayForScheduledDate } from "./universalDayForScheduledDate";
import {
  SOCIAL_POST_DRAFT_STATUSES,
  SOCIAL_POST_PLATFORMS,
  type SocialPostDraftFormValues,
  type SocialPostDraftStatus,
  type SocialPostPlatform,
} from "./types";

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

function parsePlatform(raw: string): SocialPostPlatform {
  if ((SOCIAL_POST_PLATFORMS as readonly string[]).includes(raw)) {
    return raw as SocialPostPlatform;
  }
  return "instagram";
}

function parseCompanionType(raw: string): SocialPostDraftFormValues["companionType"] {
  return isCompanionType(raw) ? raw : "owl";
}

export type ParseSocialPostDraftResult =
  | { ok: true; data: SocialPostDraftFormValues }
  | { ok: false; error: string };

export function parseSocialPostDraftFormData(formData: FormData): ParseSocialPostDraftResult {
  const theme = trimOrEmpty(formData.get("theme"));
  const companionType = parseCompanionType(trimOrEmpty(formData.get("companionType")));
  const platform = parsePlatform(trimOrEmpty(formData.get("platform")));
  const scheduledDate = trimOrEmpty(formData.get("scheduledDate"));
  const todayNumber = universalDayForScheduledDate(scheduledDate);
  const bodyText = trimOrEmpty(formData.get("bodyText"));
  const hashtags = trimOrEmpty(formData.get("hashtags"));
  const imageMemo = trimOrEmpty(formData.get("imageMemo"));
  const linkUrl = trimOrEmpty(formData.get("linkUrl"));
  const internalMemo = trimOrEmpty(formData.get("internalMemo"));
  const status = parseStatus(trimOrEmpty(formData.get("status")));

  if (scheduledDate && !DATE_RE.test(scheduledDate)) {
    return { ok: false, error: "予定日は YYYY-MM-DD 形式で入力してください。" };
  }

  if (linkUrl && !/^https?:\/\//i.test(linkUrl)) {
    return { ok: false, error: "リンクは http:// または https:// から始めてください。" };
  }

  if (!companionTypes.includes(companionType)) {
    return { ok: false, error: "キャラの指定が不正です。" };
  }

  return {
    ok: true,
    data: {
      theme,
      companionType,
      platform,
      scheduledDate,
      todayNumber,
      bodyText,
      hashtags,
      imageMemo,
      linkUrl,
      internalMemo,
      status,
    },
  };
}
