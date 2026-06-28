import { prisma } from "@/lib/db";

import { parseDailyNumberGeneratedPayload } from "./lookup";
import type { DailyNumberDraftFormValues, DailyNumberMessageType } from "./types";
import { DAILY_NUMBER_MESSAGE_TYPES } from "./types";
import type { SocialPostDraftStatus } from "@/lib/admin/post-atelier/types";
import { SOCIAL_POST_DRAFT_STATUSES } from "@/lib/admin/post-atelier/types";

export type DailyNumberDraftRecord = Omit<
  DailyNumberDraftFormValues,
  "coverVariantMode" | "resolvedVariant"
> & {
  id: string;
  authorEmail: string;
  createdAt: Date;
  updatedAt: Date;
  todayNumber: number | null;
  postType: string;
  generatedPayload: string;
  captionText: string;
  bodyText: string;
  theme: string;
};

export async function getDailyNumberDraftById(id: string): Promise<DailyNumberDraftRecord | null> {
  const row = await prisma.socialPostDraft.findUnique({ where: { id } });
  if (!row || row.postType !== "daily_number") return null;
  const savedPayload = parseDailyNumberGeneratedPayload(row.generatedPayload);
  return {
    id: row.id,
    authorEmail: row.authorEmail,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    scheduledDate: row.scheduledDate,
    companionType: row.companionType as DailyNumberDraftRecord["companionType"],
    messageType: (DAILY_NUMBER_MESSAGE_TYPES as readonly string[]).includes(row.messageType)
      ? (row.messageType as DailyNumberMessageType)
      : "base",
    messageSeasonMode: savedPayload?.messageSeasonMode ?? "base",
    lockedMessageSeason:
      savedPayload?.messageSeasonMode === "random" ? savedPayload.messageSeason : undefined,
    status: (SOCIAL_POST_DRAFT_STATUSES as readonly string[]).includes(row.status)
      ? (row.status as SocialPostDraftStatus)
      : "draft",
    internalMemo: row.internalMemo,
    todayNumber: row.todayNumber,
    postType: row.postType,
    generatedPayload: row.generatedPayload,
    captionText: row.captionText,
    bodyText: row.bodyText,
    theme: row.theme,
  };
}

export function loadPayloadFromDraft(record: DailyNumberDraftRecord) {
  return parseDailyNumberGeneratedPayload(record.generatedPayload);
}
