import { isAdminEmail } from "@/lib/admin/access";
import { prisma } from "@/lib/db";
import { findKanteiOrderForProfile } from "@/lib/profile/orderPerProfile";
import {
  getJournalEntryPhotoRecordForViewer,
  type JournalEntryPhotoRecord,
} from "@/lib/journal/journalEntryPhoto";
import { loadJournalEntryPhotoPayload } from "@/lib/journal/journalEntryPhotoResolve";
import { sanitizeJournalCommentForResponse } from "@/lib/journal/kanteiCommentEligibility";
import { getMoodMeta, normalizeCompanionType } from "@/lib/journal/meta";
import { buildDiaryNumbers } from "@/lib/journal/numbers";

import {
  buildJournalSocialPostImageInput,
} from "./compositeImage";
import {
  extractSocialPostBodyText,
  extractSocialPostCommentText,
  clampJournalSocialPostTitle,
  resolveJournalSocialPostSubtitle,
} from "./textExtract";
import {
  isMoriAshiatoTemplateId,
  normalizeJournalSocialPostTemplateId,
} from "./templates";
import type { JournalSocialPostPhotoAdjust } from "./photoAdjust";
import type { JournalSocialPostImageInput } from "./types";

/** 森ログカードの手動本文・ひとこと（あしあと／読み解き抜粋の代わり） */
const MORI_MANUAL_TEXT_MAX_CHARS = 80;

function clampManualCardText(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, MORI_MANUAL_TEXT_MAX_CHARS);
}

const entrySelect = {
  id: true,
  profileId: true,
  content: true,
  mood: true,
  companionType: true,
  generatedComment: true,
  createdAt: true,
} as const;

export type JournalSocialPostImageContext = {
  entryId: string;
  createdAt: Date;
  input: JournalSocialPostImageInput;
};

async function findEntryForViewer(entryId: string, viewerEmail: string) {
  const trimmedId = entryId.trim();
  if (!trimmedId) return null;

  if (await isAdminEmail(viewerEmail)) {
    return prisma.journalEntry.findFirst({
      where: { id: trimmedId },
      select: entrySelect,
    });
  }

  return prisma.journalEntry.findFirst({
    where: { id: trimmedId, email: viewerEmail },
    select: entrySelect,
  });
}

async function resolvePhotoBuffer(
  photoRecord: JournalEntryPhotoRecord | null,
): Promise<Buffer | null> {
  if (!photoRecord) return null;
  const payload = await loadJournalEntryPhotoPayload(photoRecord);
  if (!payload || payload.kind !== "bytes") return null;
  return payload.buffer;
}

export async function loadJournalSocialPostImageContext(params: {
  entryId: string;
  viewerEmail: string;
  title: string;
  subtitle?: string | null;
  /** 指定時はあしあと本文抜粋の代わりに使う（森ログカード用） */
  bodyExcerpt?: string | null;
  /** 指定時は読み解き抜粋の代わりに使う（森ログカード用） */
  commentExcerpt?: string | null;
  /** 今日のあしあとなど：3択ラベル */
  promptLabel?: string | null;
  /** 3コマなど：全体のおまとめ（今日のひとこと） */
  summary?: string | null;
  templateId?: string | null;
  photoAdjust?: JournalSocialPostPhotoAdjust;
}): Promise<JournalSocialPostImageContext | null> {
  const entry = await findEntryForViewer(params.entryId, params.viewerEmail);
  if (!entry) return null;

  const kanteiOrder = await findKanteiOrderForProfile({
    viewerEmail: params.viewerEmail,
    profileId: entry.profileId,
  });
  const kanteiOrderExists = kanteiOrder != null;

  let lifePathNumber: number | null = null;
  if (kanteiOrder?.numerologyJson) {
    try {
      const parsed = JSON.parse(kanteiOrder.numerologyJson) as { lifePathNumber?: unknown };
      const value = Number(parsed.lifePathNumber);
      if (Number.isFinite(value)) lifePathNumber = value;
    } catch {
      lifePathNumber = null;
    }
  }

  const diaryNumbers = buildDiaryNumbers({
    birthMonth: kanteiOrder?.birthMonth ?? null,
    birthDay: kanteiOrder?.birthDay ?? null,
    lifePathNumber,
    date: entry.createdAt,
  });

  const commentRaw = sanitizeJournalCommentForResponse(
    entry.generatedComment,
    kanteiOrderExists,
  );

  const photoRecord = await getJournalEntryPhotoRecordForViewer({
    entryId: entry.id,
    viewerEmail: params.viewerEmail,
  });
  const photoBuffer = await resolvePhotoBuffer(photoRecord);

  const moodMeta = getMoodMeta(entry.mood);
  const templateId = normalizeJournalSocialPostTemplateId(params.templateId);
  const useMoriManualText =
    isMoriAshiatoTemplateId(templateId) &&
    (params.bodyExcerpt != null ||
      params.commentExcerpt != null ||
      params.promptLabel != null ||
      params.summary != null);

  const bodyExcerpt = useMoriManualText
    ? clampManualCardText(params.bodyExcerpt ?? "")
    : extractSocialPostBodyText(entry.content, templateId);
  const commentExcerpt = useMoriManualText
    ? clampManualCardText(params.commentExcerpt ?? "")
    : commentRaw
      ? extractSocialPostCommentText(commentRaw)
      : "";
  const promptLabel = useMoriManualText
    ? clampManualCardText(params.promptLabel ?? "")
    : "";
  const summary = useMoriManualText ? clampManualCardText(params.summary ?? "") : "";

  return {
    entryId: entry.id,
    createdAt: entry.createdAt,
    input: buildJournalSocialPostImageInput({
      templateId,
      title: clampJournalSocialPostTitle(params.title, templateId),
      bodyExcerpt,
      subtitle: resolveJournalSocialPostSubtitle(params.subtitle),
      todayNumber: diaryNumbers.today,
      monthNumber: diaryNumbers.month,
      yearNumber: diaryNumbers.year,
      moodLabel: moodMeta.label,
      commentExcerpt,
      promptLabel,
      summary,
      photoBuffer,
      photoAdjust: params.photoAdjust,
      companionType: normalizeCompanionType(entry.companionType),
      createdAt: entry.createdAt,
    }),
  };
}
