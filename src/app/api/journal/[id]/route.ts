import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { collectTemplateIdsFromReadingText } from "@/lib/diary-reading/generateDiaryReading";
import {
  buildJournalGeneratedComment,
  profileHasKanteiOrder,
  sanitizeJournalCommentForResponse,
} from "@/lib/journal/kanteiCommentEligibility";
import { findKanteiOrderForProfile } from "@/lib/profile/orderPerProfile";
import { buildJournalNumerologyDebug } from "@/lib/journal/journalNumerologyDebug";
import { buildDiaryNumbers } from "@/lib/journal/numbers";
import { shouldPreserveJournalGeneratedComment } from "@/lib/journal/preserveDiaryReading";
import { resolveContentFontModeFromRequest } from "@/lib/journal/contentFontMode";
import { formatJournalEntryForApiResponse } from "@/lib/journal/journalEntryApiSerialize";
import {
  parsePhotoPatchFromRequestBody,
  resolveJournalEntryPhotoDbFields,
} from "@/lib/journal/journalEntryPhotoPersist";
import { deleteJournalEntryPhotoBlobBestEffort } from "@/lib/journal/journalEntryPhotoBlob";
import {
  isActivityId,
  isAllowedDiaryDesignThemeRaw,
  isCompanionType,
  isMoodId,
  normalizeDiaryDesignTheme,
} from "@/lib/journal/meta";

const entrySelectWithPhoto = {
  id: true,
  profileId: true,
  content: true,
  mood: true,
  activity: true,
  companionType: true,
  designTheme: true,
  contentFontMode: true,
  photoDataUrl: true,
  photoBlobUrl: true,
  photoBlobPathname: true,
  photoMimeType: true,
  photoSizeBytes: true,
  photoStorageProvider: true,
  generatedComment: true,
  createdAt: true,
  updatedAt: true,
  includeInBook: true,
} as const;

const entrySelectWithPhotoFallback = {
  id: true,
  profileId: true,
  content: true,
  mood: true,
  activity: true,
  companionType: true,
  contentFontMode: true,
  photoDataUrl: true,
  photoBlobUrl: true,
  photoBlobPathname: true,
  photoMimeType: true,
  photoSizeBytes: true,
  photoStorageProvider: true,
  generatedComment: true,
  createdAt: true,
  updatedAt: true,
  includeInBook: true,
} as const;

type Params = { params: Promise<{ id: string }> };

const JSON_NO_STORE = {
  headers: {
    "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  },
} as const;

function isDesignThemeValidationError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientValidationError)) return false;
  return /designTheme/.test(error.message);
}

function parseEntryDate(input: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
  if (!m) return null;
  const y = Number(m[1]);
  const mon = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mon) || !Number.isFinite(d)) return null;
  if (mon < 1 || mon > 12 || d < 1 || d > 31) return null;
  const probe = new Date(Date.UTC(y, mon - 1, d, 12, 0, 0));
  if (
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() !== mon - 1 ||
    probe.getUTCDate() !== d
  ) {
    return null;
  }
  return probe;
}

export async function GET(req: Request, { params }: Params) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json(
      { error: "ログイン情報を確認できませんでした。", code: "AUTH_REQUIRED" },
      { status: 401, ...JSON_NO_STORE },
    );
  }

  const { id } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- select shape varies with designTheme fallback
  let row: any = null;
  try {
    row = await prisma.journalEntry.findFirst({
      where: { id, email: viewerEmail },
      select: entrySelectWithPhoto,
    });
  } catch (error) {
    if (!isDesignThemeValidationError(error)) throw error;
    row = await prisma.journalEntry.findFirst({
      where: { id, email: viewerEmail },
      select: entrySelectWithPhotoFallback,
    });
  }
  if (!row) {
    return NextResponse.json(
      { error: "対象の記録が見つかりません。", code: "NOT_FOUND" },
      { status: 404, ...JSON_NO_STORE },
    );
  }

  const kanteiOrder = await findKanteiOrderForProfile({
    viewerEmail,
    profileId: row.profileId,
  });
  const kanteiOrderExists = kanteiOrder != null;

  let lifePathNumber: number | null = null;
  if (kanteiOrder?.numerologyJson) {
    try {
      const parsed = JSON.parse(kanteiOrder.numerologyJson) as { lifePathNumber?: unknown };
      const value = Number(parsed.lifePathNumber);
      if (Number.isFinite(value)) {
        lifePathNumber = value;
      }
    } catch {
      lifePathNumber = null;
    }
  }
  const diaryNumbers = buildDiaryNumbers({
    birthMonth: kanteiOrder?.birthMonth ?? null,
    birthDay: kanteiOrder?.birthDay ?? null,
    lifePathNumber,
    date: row.createdAt,
  });

  const numerologyDebugOn =
    new URL(req.url).searchParams.get("numerologyDebug") === "1";
  const numerologyDebug = numerologyDebugOn
    ? buildJournalNumerologyDebug({
        referenceDate: row.createdAt,
        birthMonth: kanteiOrder?.birthMonth ?? null,
        birthDay: kanteiOrder?.birthDay ?? null,
        lifePathNumber,
      })
    : undefined;

  const r = row as NonNullable<typeof row> & {
    id: string;
    designTheme?: string;
    generatedComment: string | null;
    photoDataUrl?: string | null;
    photoBlobUrl?: string | null;
  };
  const formatted = formatJournalEntryForApiResponse({
    ...r,
    designTheme: normalizeDiaryDesignTheme(r.designTheme ?? "simple_plain"),
    diaryNumbers,
    ...(numerologyDebug ? { numerologyDebug } : {}),
    generatedComment: sanitizeJournalCommentForResponse(r.generatedComment, kanteiOrderExists),
  });

  return NextResponse.json(
    {
      kanteiOrderExists,
      entry: formatted,
      code: "OK",
    },
    JSON_NO_STORE,
  );
}

export async function PATCH(req: Request, { params }: Params) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json(
      { error: "ログイン情報を確認できませんでした。", code: "AUTH_REQUIRED" },
      { status: 401, ...JSON_NO_STORE },
    );
  }

  const { id } = await params;
  const exists = await prisma.journalEntry.findFirst({
    where: { id, email: viewerEmail },
    select: {
      id: true,
      profileId: true,
      includeInBook: true,
      createdAt: true,
      mood: true,
      activity: true,
      companionType: true,
      generatedComment: true,
      photoDataUrl: true,
      photoBlobUrl: true,
      photoBlobPathname: true,
      photoMimeType: true,
      photoSizeBytes: true,
      photoStorageProvider: true,
    },
  });
  if (!exists) {
    return NextResponse.json({ error: "対象の記録が見つかりません。", code: "NOT_FOUND" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSONが不正です。", code: "BAD_JSON" }, { status: 400 });
  }

  const rawContent =
    typeof json === "object" && json !== null && "content" in json
      ? String((json as { content: unknown }).content)
      : "";
  const rawMood =
    typeof json === "object" && json !== null && "mood" in json
      ? String((json as { mood: unknown }).mood)
      : "calm";
  const rawCompanionType =
    typeof json === "object" && json !== null && "companionType" in json
      ? String((json as { companionType: unknown }).companionType)
      : "owl";
  const rawActivity =
    typeof json === "object" && json !== null && "activity" in json
      ? String((json as { activity: unknown }).activity)
      : "record_anyway";
  const photoPatch = parsePhotoPatchFromRequestBody(json);
  const rawPhotoDataUrl = photoPatch.kind === "set" ? photoPatch.dataUrl : "";
  const rawDesignTheme =
    typeof json === "object" && json !== null && "designTheme" in json
      ? String((json as { designTheme: unknown }).designTheme)
      : "simple";
  const rawEntryDate =
    typeof json === "object" && json !== null && "entryDate" in json
      ? String((json as { entryDate: unknown }).entryDate)
      : "";
  const rawIncludeInBook =
    typeof json === "object" && json !== null && "includeInBook" in json
      ? (json as { includeInBook: unknown }).includeInBook
      : exists.includeInBook;
  const regenerateOwlComment =
    typeof json === "object" &&
    json !== null &&
    (json as { regenerateOwlComment?: unknown }).regenerateOwlComment === true;

  const content = rawContent.trim();
  const mood = rawMood.trim();
  const activity = rawActivity.trim();
  const companionType = rawCompanionType.trim();
  const parsedEntryDate = parseEntryDate(rawEntryDate.trim());
  const includeInBook =
    typeof rawIncludeInBook === "boolean" ? rawIncludeInBook : exists.includeInBook;

  const resolvedFontMode = resolveContentFontModeFromRequest(json);
  if ("error" in resolvedFontMode) {
    return NextResponse.json(
      { error: resolvedFontMode.error, code: "BAD_CONTENT_FONT_MODE" },
      { status: 400 },
    );
  }
  const contentFontMode = resolvedFontMode.mode;

  if (!isAllowedDiaryDesignThemeRaw(rawDesignTheme)) {
    return NextResponse.json(
      { error: "デザインの値が不正です。", code: "BAD_DESIGN" },
      { status: 400 },
    );
  }
  const designTheme = normalizeDiaryDesignTheme(rawDesignTheme.trim() || "simple_plain");

  if (!content) {
    return NextResponse.json({ error: "本文を入力してください。", code: "EMPTY_CONTENT" }, { status: 400 });
  }
  if (content.length > 2000) {
    return NextResponse.json(
      { error: "本文は2000文字以内で入力してください。", code: "TOO_LONG" },
      { status: 400 },
    );
  }
  if (!isMoodId(mood)) {
    return NextResponse.json({ error: "気分の値が不正です。", code: "BAD_MOOD" }, { status: 400 });
  }
  if (!isCompanionType(companionType)) {
    return NextResponse.json(
      { error: "companionType の値が不正です。", code: "BAD_COMPANION" },
      { status: 400 },
    );
  }
  if (!isActivityId(activity)) {
    return NextResponse.json(
      { error: "今日やったことの値が不正です。", code: "BAD_ACTIVITY" },
      { status: 400 },
    );
  }
  if (photoPatch.kind === "set") {
    if (!rawPhotoDataUrl.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "写真データの形式が不正です。", code: "BAD_PHOTO" },
        { status: 400 },
      );
    }
    if (rawPhotoDataUrl.length > 2_000_000) {
      return NextResponse.json(
        { error: "写真サイズが大きすぎます。", code: "PHOTO_TOO_LARGE" },
        { status: 400 },
      );
    }
  }
  if (!parsedEntryDate) {
    return NextResponse.json(
      { error: "記録日の値が不正です。", code: "BAD_ENTRY_DATE" },
      { status: 400 },
    );
  }

  /** 記録日・気分・活動・おともが変わったら再生成。本文・写真・文字サイズ等のみなら preserve（regenerateOwlComment で強制再生成可） */
  const preserveDiaryReading = shouldPreserveJournalGeneratedComment({
    regenerateOwlComment,
    moodUnchanged: exists.mood === mood,
    activityUnchanged: exists.activity === activity,
    companionUnchanged: exists.companionType === companionType,
    entryDateUnchanged: parsedEntryDate.getTime() === exists.createdAt.getTime(),
    hasExistingComment: Boolean(exists.generatedComment?.trim()),
  });

  const recentRows = await prisma.journalEntry.findMany({
    where: { email: viewerEmail, profileId: exists.profileId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { generatedComment: true },
  });
  const recentTemplateIds = recentRows.flatMap((row) =>
    collectTemplateIdsFromReadingText(row.generatedComment ?? ""),
  );

  const generatedComment = await buildJournalGeneratedComment({
    viewerEmail,
    profileId: exists.profileId,
    activity,
    mood,
    referenceDate: parsedEntryDate,
    recentTemplateIds,
    existingComment: exists.generatedComment,
    preserveDiaryReading,
  });

  const kanteiOrderExists = await profileHasKanteiOrder(viewerEmail, exists.profileId);

  const photoDbFields = await resolveJournalEntryPhotoDbFields({
    patch: photoPatch,
    existing: exists,
    profileId: exists.profileId,
    entryId: id,
  });

  let entry = null;
  try {
    entry = await prisma.journalEntry.update({
      where: { id },
      data: {
        content,
        createdAt: parsedEntryDate,
        mood,
        activity,
        companionType,
        designTheme,
        contentFontMode,
        ...photoDbFields,
        generatedComment,
        includeInBook,
      },
      select: entrySelectWithPhoto,
    });
  } catch (error) {
    if (!isDesignThemeValidationError(error)) throw error;
    entry = await prisma.journalEntry.update({
      where: { id },
      data: {
        content,
        createdAt: parsedEntryDate,
        mood,
        activity,
        companionType,
        contentFontMode,
        ...photoDbFields,
        generatedComment,
        includeInBook,
      },
      select: entrySelectWithPhotoFallback,
    });
  }
  return NextResponse.json(
    {
      entry: entry ? formatJournalEntryForApiResponse(entry) : null,
      kanteiOrderExists,
      code: "OK",
    },
    JSON_NO_STORE,
  );
}

export async function DELETE(_: Request, { params }: Params) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json(
      { error: "ログイン情報を確認できませんでした。", code: "AUTH_REQUIRED" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const exists = await prisma.journalEntry.findFirst({
    where: { id, email: viewerEmail },
    select: {
      id: true,
      photoBlobPathname: true,
      photoBlobUrl: true,
    },
  });
  if (!exists) {
    return NextResponse.json({ error: "対象の記録が見つかりません。", code: "NOT_FOUND" }, { status: 404 });
  }

  await prisma.journalEntry.delete({ where: { id } });
  await deleteJournalEntryPhotoBlobBestEffort(exists.photoBlobPathname, exists.photoBlobUrl);
  return NextResponse.json({ code: "OK" });
}
