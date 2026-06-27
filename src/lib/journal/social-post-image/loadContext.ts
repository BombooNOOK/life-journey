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
} from "./textExtract";
import {
  normalizeJournalSocialPostTemplateId,
} from "./templates";
import type { JournalSocialPostImageInput } from "./types";

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
  templateId?: string | null;
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

  return {
    entryId: entry.id,
    createdAt: entry.createdAt,
    input: buildJournalSocialPostImageInput({
      templateId,
      title: params.title,
      bodyExcerpt: extractSocialPostBodyText(entry.content),
      todayNumber: diaryNumbers.today,
      monthNumber: diaryNumbers.month,
      yearNumber: diaryNumbers.year,
      moodLabel: moodMeta.label,
      commentExcerpt: commentRaw ? extractSocialPostCommentText(commentRaw) : "",
      photoBuffer,
      companionType: normalizeCompanionType(entry.companionType),
      createdAt: entry.createdAt,
    }),
  };
}
