import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

import {
  SOCIAL_POST_DRAFT_STATUSES,
  SOCIAL_POST_PLATFORMS,
  type SocialPostDraftListItem,
  type SocialPostDraftRecord,
  type SocialPostDraftStatus,
  type SocialPostPlatform,
} from "./types";

function truncatePreview(text: string, max = 80): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

function toPlatform(value: string): SocialPostPlatform {
  return (SOCIAL_POST_PLATFORMS as readonly string[]).includes(value)
    ? (value as SocialPostPlatform)
    : "other";
}

function toStatus(value: string): SocialPostDraftStatus {
  return (SOCIAL_POST_DRAFT_STATUSES as readonly string[]).includes(value)
    ? (value as SocialPostDraftStatus)
    : "draft";
}

function mapRecord(row: {
  id: string;
  authorEmail: string;
  createdAt: Date;
  updatedAt: Date;
  theme: string;
  companionType: string;
  platform: string;
  scheduledDate: string;
  todayNumber: number | null;
  bodyText: string;
  hashtags: string;
  imageMemo: string;
  linkUrl: string;
  internalMemo: string;
  status: string;
  templateId: string | null;
}): SocialPostDraftRecord {
  return {
    id: row.id,
    authorEmail: row.authorEmail,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    theme: row.theme,
    companionType: row.companionType as SocialPostDraftRecord["companionType"],
    platform: toPlatform(row.platform),
    scheduledDate: row.scheduledDate,
    todayNumber: row.todayNumber,
    bodyText: row.bodyText,
    hashtags: row.hashtags,
    imageMemo: row.imageMemo,
    linkUrl: row.linkUrl,
    internalMemo: row.internalMemo,
    status: toStatus(row.status),
    templateId: row.templateId,
  };
}

export async function getSocialPostDraftById(id: string): Promise<SocialPostDraftRecord | null> {
  const row = await prisma.socialPostDraft.findUnique({ where: { id } });
  return row ? mapRecord(row) : null;
}

export type ListSocialPostDraftsFilters = {
  status?: string;
  platform?: string;
  month?: string;
};

function buildListWhere(filters: ListSocialPostDraftsFilters): Prisma.SocialPostDraftWhereInput {
  const where: Prisma.SocialPostDraftWhereInput = {};
  const status = filters.status?.trim();
  const platform = filters.platform?.trim();
  const month = filters.month?.trim();

  if (status && (SOCIAL_POST_DRAFT_STATUSES as readonly string[]).includes(status)) {
    where.status = status;
  }
  if (platform && (SOCIAL_POST_PLATFORMS as readonly string[]).includes(platform)) {
    where.platform = platform;
  }
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    where.scheduledDate = { startsWith: month };
  }
  return where;
}

export async function listSocialPostDrafts(
  filters: ListSocialPostDraftsFilters = {},
  take = 200,
): Promise<SocialPostDraftListItem[]> {
  const rows = await prisma.socialPostDraft.findMany({
    where: buildListWhere(filters),
    orderBy: [{ scheduledDate: "desc" }, { updatedAt: "desc" }],
    take,
    select: {
      id: true,
      theme: true,
      companionType: true,
      platform: true,
      scheduledDate: true,
      todayNumber: true,
      status: true,
      postType: true,
      updatedAt: true,
      bodyText: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    theme: row.theme,
    companionType: row.companionType,
    platform: toPlatform(row.platform),
    scheduledDate: row.scheduledDate,
    todayNumber: row.todayNumber,
    status: toStatus(row.status),
    postType: row.postType,
    updatedAt: row.updatedAt,
    bodyPreview: truncatePreview(row.bodyText),
  }));
}

export async function listSocialPostDraftsForCalendar(month: string): Promise<SocialPostDraftListItem[]> {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return listSocialPostDrafts({}, 200);
  }
  return listSocialPostDrafts({ month }, 200);
}

export async function countSocialPostDraftsByStatus(): Promise<Record<SocialPostDraftStatus, number>> {
  const groups = await prisma.socialPostDraft.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const counts = Object.fromEntries(
    SOCIAL_POST_DRAFT_STATUSES.map((s) => [s, 0]),
  ) as Record<SocialPostDraftStatus, number>;
  for (const g of groups) {
    const status = toStatus(g.status);
    counts[status] = g._count._all;
  }
  return counts;
}
