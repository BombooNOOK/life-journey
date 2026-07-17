import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";

export type JournalDraftView = {
  id: string;
  email: string;
  profileId: string;
  dateKey: string;
  content: string;
  mood: string;
  activity: string;
  companionType: string;
  designTheme: string;
  contentFontMode: string;
  photoBlobUrl: string | null;
  writingMode: string;
  createdAt: string;
  updatedAt: string;
};

function toView(row: {
  id: string;
  email: string;
  profileId: string;
  dateKey: string;
  content: string;
  mood: string;
  activity: string;
  companionType: string;
  designTheme: string;
  contentFontMode: string;
  photoBlobUrl: string | null;
  writingMode: string;
  createdAt: Date;
  updatedAt: Date;
}): JournalDraftView {
  return {
    id: row.id,
    email: row.email,
    profileId: row.profileId,
    dateKey: row.dateKey,
    content: row.content,
    mood: row.mood,
    activity: row.activity,
    companionType: row.companionType,
    designTheme: row.designTheme,
    contentFontMode: row.contentFontMode,
    photoBlobUrl: row.photoBlobUrl,
    writingMode: row.writingMode,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getJournalDraft(params: {
  email: string;
  profileId: string;
  dateKey: string;
}): Promise<JournalDraftView | null> {
  const email = normalizeEmail(params.email);
  const profileId = params.profileId.trim();
  const dateKey = params.dateKey.trim();
  if (!email || !profileId || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;

  const row = await prisma.journalDraft.findUnique({
    where: {
      email_profileId_dateKey: { email, profileId, dateKey },
    },
  });
  return row ? toView(row) : null;
}

export type UpsertJournalDraftInput = {
  email: string;
  profileId: string;
  dateKey: string;
  content: string;
  mood?: string;
  activity?: string;
  companionType?: string;
  designTheme?: string;
  contentFontMode?: string;
  writingMode?: string;
};

export async function upsertJournalDraft(
  input: UpsertJournalDraftInput,
): Promise<JournalDraftView> {
  const email = normalizeEmail(input.email);
  const profileId = input.profileId.trim();
  const dateKey = input.dateKey.trim();
  if (!email || !profileId) throw new Error("email / profileId が必要です");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) throw new Error("日付が不正です");

  const data = {
    content: input.content,
    mood: input.mood?.trim() || "calm",
    activity: input.activity?.trim() || "record_anyway",
    companionType: input.companionType?.trim() || "owl",
    designTheme: input.designTheme?.trim() || "simple",
    contentFontMode: input.contentFontMode?.trim() || "standard",
    writingMode: input.writingMode?.trim() || "alone",
  };

  const row = await prisma.journalDraft.upsert({
    where: {
      email_profileId_dateKey: { email, profileId, dateKey },
    },
    create: {
      email,
      profileId,
      dateKey,
      ...data,
    },
    update: data,
  });
  return toView(row);
}

export async function deleteJournalDraft(params: {
  email: string;
  profileId: string;
  dateKey: string;
}): Promise<boolean> {
  const email = normalizeEmail(params.email);
  const profileId = params.profileId.trim();
  const dateKey = params.dateKey.trim();
  if (!email || !profileId || !dateKey) return false;

  try {
    await prisma.journalDraft.delete({
      where: {
        email_profileId_dateKey: { email, profileId, dateKey },
      },
    });
    return true;
  } catch {
    return false;
  }
}
