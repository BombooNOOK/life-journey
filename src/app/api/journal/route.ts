import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";

/** Browsers and intermediaries must not cache per-user diary payloads. */
const JSON_NO_STORE = {
  headers: {
    "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  },
} as const;
import { prisma } from "@/lib/db";
import { buildDiaryNumbers } from "@/lib/journal/numbers";
import { profileByIdForViewer, resolveActiveProfileId } from "@/lib/profile/activeProfile";
import { collectTemplateIdsFromReadingText } from "@/lib/diary-reading/generateDiaryReading";
import { buildDiaryReadingFromJournalInput } from "@/lib/diary-reading/fromJournal";
import { normalizeJournalCommentText } from "@/lib/journal/comment";
import { isActivityId, isCompanionType, isDiaryDesignId, isMoodId } from "@/lib/journal/meta";

function isDesignThemeValidationError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientValidationError)) return false;
  return /designTheme/.test(error.message);
}

function parseMonth(input: string | null): { from: Date; to: Date } | null {
  if (!input) return null;
  const m = /^(\d{4})-(\d{2})$/.exec(input);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }
  const from = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const to = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  return { from, to };
}

function parseYear(input: string | null): { from: Date; to: Date } | null {
  if (!input) return null;
  const m = /^(\d{4})$/.exec(input.trim());
  if (!m) return null;
  const year = Number(m[1]);
  if (!Number.isFinite(year) || year < 1970 || year > 2100) return null;
  return {
    from: new Date(Date.UTC(year, 0, 1, 0, 0, 0)),
    to: new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0)),
  };
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

export async function GET(req: Request) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json(
      { error: "ログイン情報を確認できませんでした。", code: "AUTH_REQUIRED" },
      { status: 401, ...JSON_NO_STORE },
    );
  }

  try {
    const url = new URL(req.url);
    const rawProfileId = (url.searchParams.get("profileId") ?? "").trim();
    const activeProfileId = await resolveActiveProfileId(viewerEmail);
    const profileId = rawProfileId || activeProfileId;
    if (profileId) {
      const p = await profileByIdForViewer(profileId, viewerEmail);
      if (!p) {
        return NextResponse.json({ error: "指定プロフィールは利用できません。", code: "FORBIDDEN_PROFILE" }, { status: 403 });
      }
    }
    const yearFilter = parseYear(url.searchParams.get("year"));
    const monthFilter = yearFilter ? null : parseMonth(url.searchParams.get("month"));
    const rangeFilter = yearFilter ?? monthFilter;
    const takeLimit = yearFilter ? 500 : monthFilter ? 400 : 120;
    let rows:
      | Array<{
          id: string;
          content: string;
          createdAt: Date;
          mood: string;
          activity: string;
          companionType: string;
          designTheme?: string;
          photoDataUrl: string | null;
          generatedComment: string | null;
          includeInBook: boolean;
        }>
      | [] = [];
    try {
      rows = await prisma.journalEntry.findMany({
        where: {
          email: viewerEmail,
          profileId,
          ...(rangeFilter
            ? { createdAt: { gte: rangeFilter.from, lt: rangeFilter.to } }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        take: takeLimit,
        select: {
          id: true,
          content: true,
          createdAt: true,
          mood: true,
          activity: true,
          companionType: true,
          designTheme: true,
          photoDataUrl: true,
          generatedComment: true,
          includeInBook: true,
        },
      });
    } catch (error) {
      if (!isDesignThemeValidationError(error)) throw error;
      rows = await prisma.journalEntry.findMany({
        where: {
          email: viewerEmail,
          profileId,
          ...(rangeFilter
            ? { createdAt: { gte: rangeFilter.from, lt: rangeFilter.to } }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        take: takeLimit,
        select: {
          id: true,
          content: true,
          createdAt: true,
          mood: true,
          activity: true,
          companionType: true,
          photoDataUrl: true,
          generatedComment: true,
          includeInBook: true,
        },
      });
    }
    let lifePathNumber: number | null = null;
    let birthMonth: number | null = null;
    let birthDay: number | null = null;
    if (yearFilter && rows.length > 0) {
      const latestOrder = await prisma.order.findFirst({
        where: { email: viewerEmail, profileId },
        orderBy: { createdAt: "desc" },
        select: {
          birthMonth: true,
          birthDay: true,
          numerologyJson: true,
        },
      });
      birthMonth = latestOrder?.birthMonth ?? null;
      birthDay = latestOrder?.birthDay ?? null;
      if (latestOrder?.numerologyJson) {
        try {
          const parsed = JSON.parse(latestOrder.numerologyJson) as {
            lifePathNumber?: unknown;
          };
          const value = Number(parsed.lifePathNumber);
          if (Number.isFinite(value)) lifePathNumber = value;
        } catch {
          lifePathNumber = null;
        }
      }
    }

    return NextResponse.json(
      {
        entries: rows.map((row) => {
          const normalizedComment = row.generatedComment
            ? normalizeJournalCommentText(row.generatedComment)
            : row.generatedComment;
          const base = {
            ...row,
            generatedComment: normalizedComment,
          };
          if (!yearFilter) return base;
          return {
            ...base,
            diaryNumbers: buildDiaryNumbers({
              birthMonth,
              birthDay,
              lifePathNumber,
              date: row.createdAt,
            }),
          };
        }),
        code: "OK",
      },
      JSON_NO_STORE,
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "日記の取得に失敗しました。";
    return NextResponse.json({ error: message, code: "DB_READ" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json(
      { error: "ログイン情報を確認できませんでした。", code: "AUTH_REQUIRED" },
      { status: 401 },
    );
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
      : true;
  const rawProfileId =
    typeof json === "object" && json !== null && "profileId" in json
      ? String((json as { profileId: unknown }).profileId)
      : "";
  const activeProfileId = await resolveActiveProfileId(viewerEmail);
  const profileId = rawProfileId.trim() || activeProfileId;
  if (profileId) {
    const p = await profileByIdForViewer(profileId, viewerEmail);
    if (!p) {
      return NextResponse.json({ error: "指定プロフィールは利用できません。", code: "FORBIDDEN_PROFILE" }, { status: 403 });
    }
  }
  const content = rawContent.trim();
  const mood = rawMood.trim();
  const activity = rawActivity.trim();
  const companionType = rawCompanionType.trim();
  const designTheme = rawDesignTheme.trim();
  const photoDataUrl = rawPhotoDataUrl.trim();
  const parsedEntryDate = parseEntryDate(rawEntryDate.trim());
  const includeInBook = typeof rawIncludeInBook === "boolean" ? rawIncludeInBook : true;

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
    return NextResponse.json(
      { error: "気分の値が不正です。", code: "BAD_MOOD" },
      { status: 400 },
    );
  }
  if (!isActivityId(activity)) {
    return NextResponse.json(
      { error: "今日やったことの値が不正です。", code: "BAD_ACTIVITY" },
      { status: 400 },
    );
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

  try {
    const latestOrder = await prisma.order.findFirst({
      where: { email: viewerEmail, profileId },
      orderBy: { createdAt: "desc" },
      select: {
        birthMonth: true,
        birthDay: true,
        numerologyJson: true,
      },
    });
    const recentRows = await prisma.journalEntry.findMany({
      where: { email: viewerEmail, profileId },
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
          createdAt: Date;
          mood: string;
          activity: string;
          companionType: string;
          designTheme?: string;
          photoDataUrl: string | null;
          generatedComment: string | null;
          includeInBook: boolean;
        }
      | null = null;
    try {
      entry = await prisma.journalEntry.create({
        data: {
          email: viewerEmail,
          profileId,
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
          createdAt: true,
          mood: true,
          activity: true,
          companionType: true,
          designTheme: true,
          photoDataUrl: true,
          generatedComment: true,
          includeInBook: true,
        },
      });
    } catch (error) {
      if (!isDesignThemeValidationError(error)) throw error;
      entry = await prisma.journalEntry.create({
        data: {
          email: viewerEmail,
          profileId,
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
          createdAt: true,
          mood: true,
          activity: true,
          companionType: true,
          photoDataUrl: true,
          generatedComment: true,
          includeInBook: true,
        },
      });
    }
    return NextResponse.json({ entry, code: "OK" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "日記の保存に失敗しました。";
    return NextResponse.json({ error: message, code: "DB_SAVE" }, { status: 500 });
  }
}
