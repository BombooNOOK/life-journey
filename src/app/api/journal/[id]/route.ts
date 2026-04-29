import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { collectTemplateIdsFromReadingText } from "@/lib/diary-reading/generateDiaryReading";
import { buildDiaryReadingFromJournalInput } from "@/lib/diary-reading/fromJournal";
import { normalizeJournalCommentText } from "@/lib/journal/comment";
import { buildDiaryNumbers } from "@/lib/journal/numbers";
import { isActivityId, isCompanionType, isDiaryDesignId, isMoodId } from "@/lib/journal/meta";

type Params = { params: Promise<{ id: string }> };

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

export async function GET(_: Request, { params }: Params) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json(
      { error: "ログイン情報を確認できませんでした。", code: "AUTH_REQUIRED" },
      { status: 401 },
    );
  }

  const { id } = await params;
  let row:
    | {
        id: string;
        content: string;
        mood: string;
        activity: string;
        companionType: string;
        designTheme?: string;
        photoDataUrl: string | null;
        generatedComment: string | null;
        createdAt: Date;
        includeInBook: boolean;
      }
    | null = null;
  try {
    row = await prisma.journalEntry.findFirst({
      where: { id, email: viewerEmail },
      select: {
        id: true,
        content: true,
        mood: true,
        activity: true,
        companionType: true,
        designTheme: true,
        photoDataUrl: true,
        generatedComment: true,
        createdAt: true,
        includeInBook: true,
      },
    });
  } catch (error) {
    if (!isDesignThemeValidationError(error)) throw error;
    row = await prisma.journalEntry.findFirst({
      where: { id, email: viewerEmail },
      select: {
        id: true,
        content: true,
        mood: true,
        activity: true,
        companionType: true,
        photoDataUrl: true,
        generatedComment: true,
        createdAt: true,
        includeInBook: true,
      },
    });
  }
  if (!row) {
    return NextResponse.json({ error: "対象の記録が見つかりません。", code: "NOT_FOUND" }, { status: 404 });
  }

  const latestOrder = await prisma.order.findFirst({
    where: { email: viewerEmail },
    orderBy: { createdAt: "desc" },
    select: {
      birthMonth: true,
      birthDay: true,
      numerologyJson: true,
    },
  });

  let lifePathNumber: number | null = null;
  if (latestOrder?.numerologyJson) {
    try {
      const parsed = JSON.parse(latestOrder.numerologyJson) as { lifePathNumber?: unknown };
      const value = Number(parsed.lifePathNumber);
      if (Number.isFinite(value)) {
        lifePathNumber = value;
      }
    } catch {
      lifePathNumber = null;
    }
  }
  const diaryNumbers = buildDiaryNumbers({
    birthMonth: latestOrder?.birthMonth ?? null,
    birthDay: latestOrder?.birthDay ?? null,
    lifePathNumber,
    date: row.createdAt,
  });

  return NextResponse.json({
    entry: {
      ...row,
      diaryNumbers,
      generatedComment: row.generatedComment
        ? normalizeJournalCommentText(row.generatedComment)
        : row.generatedComment,
    },
    code: "OK",
  });
}

export async function PATCH(req: Request, { params }: Params) {
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
    select: { id: true, includeInBook: true },
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
  const rawPhotoDataUrl =
    typeof json === "object" && json !== null && "photoDataUrl" in json
      ? String((json as { photoDataUrl: unknown }).photoDataUrl)
      : "";
  const rawDesignTheme =
    typeof json === "object" && json !== null && "designTheme" in json
      ? String((json as { designTheme: unknown }).designTheme)
      : "cute";
  const rawEntryDate =
    typeof json === "object" && json !== null && "entryDate" in json
      ? String((json as { entryDate: unknown }).entryDate)
      : "";
  const rawIncludeInBook =
    typeof json === "object" && json !== null && "includeInBook" in json
      ? (json as { includeInBook: unknown }).includeInBook
      : exists.includeInBook;

  const content = rawContent.trim();
  const mood = rawMood.trim();
  const activity = rawActivity.trim();
  const companionType = rawCompanionType.trim();
  const designTheme = rawDesignTheme.trim();
  const photoDataUrl = rawPhotoDataUrl.trim();
  const parsedEntryDate = parseEntryDate(rawEntryDate.trim());
  const includeInBook =
    typeof rawIncludeInBook === "boolean" ? rawIncludeInBook : exists.includeInBook;

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
  if (!isDiaryDesignId(designTheme)) {
    return NextResponse.json(
      { error: "デザインの値が不正です。", code: "BAD_DESIGN" },
      { status: 400 },
    );
  }
  if (!isActivityId(activity)) {
    return NextResponse.json(
      { error: "今日やったことの値が不正です。", code: "BAD_ACTIVITY" },
      { status: 400 },
    );
  }
  if (photoDataUrl && !photoDataUrl.startsWith("data:image/")) {
    return NextResponse.json(
      { error: "写真データの形式が不正です。", code: "BAD_PHOTO" },
      { status: 400 },
    );
  }
  if (photoDataUrl.length > 2_000_000) {
    return NextResponse.json(
      { error: "写真サイズが大きすぎます。", code: "PHOTO_TOO_LARGE" },
      { status: 400 },
    );
  }
  if (!parsedEntryDate) {
    return NextResponse.json(
      { error: "記録日の値が不正です。", code: "BAD_ENTRY_DATE" },
      { status: 400 },
    );
  }

  const latestOrder = await prisma.order.findFirst({
    where: { email: viewerEmail },
    orderBy: { createdAt: "desc" },
    select: {
      birthMonth: true,
      birthDay: true,
      numerologyJson: true,
    },
  });
  const recentRows = await prisma.journalEntry.findMany({
    where: { email: viewerEmail },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { generatedComment: true },
  });
  const recentTemplateIds = recentRows.flatMap((row) =>
    collectTemplateIdsFromReadingText(row.generatedComment ?? ""),
  );

  const generatedComment = normalizeJournalCommentText(
    buildDiaryReadingFromJournalInput({
      activity,
      mood,
      referenceDate: parsedEntryDate,
      birthMonth: latestOrder?.birthMonth ?? null,
      birthDay: latestOrder?.birthDay ?? null,
      recentTemplateIds,
    }).text,
  );

  let entry:
    | {
        id: string;
        content: string;
        mood: string;
        activity: string;
        companionType: string;
        designTheme?: string;
        photoDataUrl: string | null;
        generatedComment: string | null;
        createdAt: Date;
        updatedAt: Date;
        includeInBook: boolean;
      }
    | null = null;
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
        photoDataUrl: photoDataUrl || null,
        generatedComment,
        includeInBook,
      },
      select: {
        id: true,
        content: true,
        mood: true,
        activity: true,
        companionType: true,
        designTheme: true,
        photoDataUrl: true,
        generatedComment: true,
        createdAt: true,
        updatedAt: true,
        includeInBook: true,
      },
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
        photoDataUrl: photoDataUrl || null,
        generatedComment,
        includeInBook,
      },
      select: {
        id: true,
        content: true,
        mood: true,
        activity: true,
        companionType: true,
        photoDataUrl: true,
        generatedComment: true,
        createdAt: true,
        updatedAt: true,
        includeInBook: true,
      },
    });
  }
  return NextResponse.json({ entry, code: "OK" });
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
    select: { id: true },
  });
  if (!exists) {
    return NextResponse.json({ error: "対象の記録が見つかりません。", code: "NOT_FOUND" }, { status: 404 });
  }

  await prisma.journalEntry.delete({ where: { id } });
  return NextResponse.json({ code: "OK" });
}
