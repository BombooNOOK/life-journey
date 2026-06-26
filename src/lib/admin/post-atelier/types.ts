import type { CompanionType } from "@/lib/journal/meta";

export const SOCIAL_POST_DRAFT_STATUSES = [
  "draft",
  "ready",
  "scheduled",
  "posted",
  "archived",
] as const;

export type SocialPostDraftStatus = (typeof SOCIAL_POST_DRAFT_STATUSES)[number];

export const SOCIAL_POST_DRAFT_STATUS_LABELS: Record<SocialPostDraftStatus, string> = {
  draft: "下書き",
  ready: "投稿準備OK",
  scheduled: "予定済み",
  posted: "投稿済み",
  archived: "アーカイブ",
};

export const SOCIAL_POST_PLATFORMS = [
  "instagram",
  "x",
  "threads",
  "facebook",
  "note",
  "other",
] as const;

export type SocialPostPlatform = (typeof SOCIAL_POST_PLATFORMS)[number];

export const SOCIAL_POST_PLATFORM_LABELS: Record<SocialPostPlatform, string> = {
  instagram: "Instagram",
  x: "X（Twitter）",
  threads: "Threads",
  facebook: "Facebook",
  note: "note",
  other: "その他",
};

export type SocialPostDraftFormValues = {
  theme: string;
  companionType: CompanionType;
  platform: SocialPostPlatform;
  scheduledDate: string;
  todayNumber: number | null;
  bodyText: string;
  hashtags: string;
  imageMemo: string;
  linkUrl: string;
  internalMemo: string;
  status: SocialPostDraftStatus;
};

export type SocialPostDraftListItem = {
  id: string;
  theme: string;
  companionType: string;
  platform: SocialPostPlatform;
  scheduledDate: string;
  todayNumber: number | null;
  status: SocialPostDraftStatus;
  postType: string;
  updatedAt: Date;
  bodyPreview: string;
};

export type SocialPostDraftRecord = SocialPostDraftFormValues & {
  id: string;
  authorEmail: string;
  createdAt: Date;
  updatedAt: Date;
  templateId: string | null;
};
