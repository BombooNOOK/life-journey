import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { loadEntitlementContext } from "@/lib/entitlement/accountSettingsForEntitlement";
import {
  canCreateJournalEntry,
  continuedFeaturesDeniedMessage,
  resolveUserEntitlement,
} from "@/lib/entitlement/resolveUserEntitlement";
import { markFreeTrialStartedIfFirstJournal } from "@/lib/entitlement/startFreeTrialOnFirstJournal";

/** Browsers and intermediaries must not cache per-user diary payloads. */
const JSON_NO_STORE = {
  headers: {
    "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  },
} as const;
import { prisma } from "@/lib/db";
import { buildDiaryNumbers } from "@/lib/journal/numbers";
import { guardianColorNameForEntryDate } from "@/lib/journal/guardianColorForEntryDate";
import { journalEntryDateToIsoDateInput } from "@/lib/journal/referenceDateParts";
import {
  journalProfileIdsForQuery,
  profileByIdForViewer,
  resolveActiveProfileId,
} from "@/lib/profile/activeProfile";
import { collectTemplateIdsFromReadingText } from "@/lib/diary-reading/generateDiaryReading";
import {
  buildJournalGeneratedComment,
  profileHasKanteiOrder,
  sanitizeJournalCommentForResponse,
} from "@/lib/journal/kanteiCommentEligibility";
import { findKanteiOrderForProfile } from "@/lib/profile/orderPerProfile";
import { resolveContentFontModeFromRequest } from "@/lib/journal/contentFontMode";
import { matchTag, matchesDiaryKeyword } from "@/lib/journal/diaryTags";
import { formatJournalEntryForApiResponse } from "@/lib/journal/journalEntryApiSerialize";
import { loadJournalEntryHasPhotoFlags } from "@/lib/journal/journalEntryHasPhoto";
import {
  parsePhotoPatchFromRequestBody,
  resolveJournalEntryPhotoDbFields,
} from "@/lib/journal/journalEntryPhotoPersist";
import {
  isActivityId,
  isAllowedDiaryDesignThemeRaw,
  isCompanionType,
  isMoodId,
  normalizeDiaryDesignTheme,
} from "@/lib/journal/meta";

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
    const viewList = url.searchParams.get("view") === "list";
    const searchQ = (url.searchParams.get("q") ?? "").trim();
    const searchTag = (url.searchParams.get("tag") ?? "").trim();
    const searchScope = url.searchParams.get("searchScope") ?? "";
    const hasSearch = Boolean(searchQ || searchTag);
    let rangeFilter = yearFilter ?? monthFilter;
    let takeLimit = viewList ? 200 : yearFilter ? 500 : monthFilter ? 400 : 120;
    if (hasSearch) {
      if (searchScope === "all") {
        rangeFilter = null;
        takeLimit = viewList ? 2000 : 500;
      } else if (searchScope === "year") {
        if (!yearFilter) {
          return NextResponse.json(
            { error: "年を指定してください。", code: "BAD_SEARCH_YEAR" },
            { status: 400, ...JSON_NO_STORE },
          );
        }
        takeLimit = viewList ? 500 : 200;
      } else if (searchScope === "month") {
        if (!monthFilter) {
          return NextResponse.json(
            { error: "月を指定してください。", code: "BAD_SEARCH_MONTH" },
            { status: 400, ...JSON_NO_STORE },
          );
        }
        takeLimit = viewList ? 400 : 200;
      }
    }
    /** 本棚年次フリップ（`?year=`）のみ photoDataUrl 本文を返す。一覧・カレンダーは hasPhoto のみ */
    const includePhotoBodyInResponse = Boolean(yearFilter);
    const profileIds = journalProfileIdsForQuery(profileId, viewerEmail);
    const profileWhere =
      profileIds.length === 1 ? { profileId: profileIds[0]! } : { profileId: { in: profileIds } };
    type JournalRow = {
      id: string;
      content: string;
      createdAt: Date;
      updatedAt: Date;
      mood: string;
      activity: string;
      companionType: string;
      designTheme?: string;
      contentFontMode: string;
      photoDataUrl?: string | null;
      generatedComment?: string | null;
      includeInBook: boolean;
    };

    const fullSelect = {
      id: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      mood: true,
      activity: true,
      companionType: true,
      designTheme: true,
      contentFontMode: true,
      photoDataUrl: true,
      generatedComment: true,
      includeInBook: true,
    } as const;

    const calendarSelect = {
      id: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      mood: true,
      activity: true,
      companionType: true,
      designTheme: true,
      contentFontMode: true,
      includeInBook: true,
    } as const;

    const calendarSelectFallback = {
      id: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      mood: true,
      activity: true,
      companionType: true,
      contentFontMode: true,
      includeInBook: true,
    } as const;

    const whereClause = {
      email: viewerEmail,
      ...profileWhere,
      ...(rangeFilter ? { createdAt: { gte: rangeFilter.from, lt: rangeFilter.to } } : {}),
    };

    const entrySelect = includePhotoBodyInResponse ? fullSelect : calendarSelect;
    const entrySelectFallback = includePhotoBodyInResponse
      ? {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          mood: true,
          activity: true,
          companionType: true,
          contentFontMode: true,
          photoDataUrl: true,
          generatedComment: true,
          includeInBook: true,
        }
      : calendarSelectFallback;

    let rows: JournalRow[] = [];
    try {
      rows = (await prisma.journalEntry.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: takeLimit,
        select: entrySelect,
      })) as JournalRow[];
    } catch (error) {
      if (!isDesignThemeValidationError(error)) throw error;
      rows = (await prisma.journalEntry.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: takeLimit,
        select: entrySelectFallback,
      })) as JournalRow[];
    }

    if (hasSearch) {
      rows = rows.filter(
        (row) =>
          matchesDiaryKeyword(row.content, searchQ) && matchTag(row.content, searchTag),
      );
    }

    const hasPhotoById = includePhotoBodyInResponse
      ? null
      : await loadJournalEntryHasPhotoFlags({
          email: viewerEmail,
          entryIds: rows.map((row) => row.id),
        });
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

    const kanteiOrderExists = profileId
      ? await profileHasKanteiOrder(viewerEmail, profileId)
      : false;

    return NextResponse.json(
      {
        kanteiOrderExists,
        entries: rows.map((row) => {
          const normalizedComment =
            row.generatedComment != null && row.generatedComment !== ""
              ? sanitizeJournalCommentForResponse(row.generatedComment, kanteiOrderExists)
              : null;
          const base = {
            ...row,
            ...(includePhotoBodyInResponse
              ? { photoDataUrl: row.photoDataUrl ?? null }
              : { hasPhoto: hasPhotoById?.get(row.id) === true }),
            designTheme: normalizeDiaryDesignTheme(row.designTheme ?? "simple_plain"),
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

  const entitlementCtx = await loadEntitlementContext(viewerEmail);
  const wasFirstJournal = entitlementCtx.journalEntryCount === 0;
  if (!canCreateJournalEntry(entitlementCtx)) {
    const entitlement = resolveUserEntitlement(entitlementCtx);
    return NextResponse.json(
      {
        error: continuedFeaturesDeniedMessage(entitlement),
        code: entitlement.denialCode ?? "FREE_TRIAL_EXPIRED",
      },
      { status: 403 },
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
      : true;
  const rawProfileId =
    typeof json === "object" && json !== null && "profileId" in json
      ? String((json as { profileId: unknown }).profileId)
      : typeof json === "object" && json !== null && "effectiveProfileId" in json
        ? String((json as { effectiveProfileId: unknown }).effectiveProfileId)
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
  const photoDataUrl = rawPhotoDataUrl.trim();
  const parsedEntryDate = parseEntryDate(rawEntryDate.trim());
  const includeInBook = typeof rawIncludeInBook === "boolean" ? rawIncludeInBook : true;

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

  try {
    const recentRows = await prisma.journalEntry.findMany({
      where: { email: viewerEmail, profileId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { generatedComment: true },
    });
    const recentTemplateIds = recentRows.flatMap((row) =>
      collectTemplateIdsFromReadingText(row.generatedComment ?? ""),
    );

    const generatedComment = await buildJournalGeneratedComment({
      viewerEmail,
      profileId,
      activity,
      mood,
      companionType,
      referenceDate: parsedEntryDate,
      recentTemplateIds,
    });

    const emptyPhoto = {
      photoDataUrl: null,
      photoBlobUrl: null,
      photoBlobPathname: null,
      photoMimeType: null,
      photoSizeBytes: null,
      photoStorageProvider: null,
    };

    let entry:
      | {
          id: string;
          content: string;
          createdAt: Date;
          mood: string;
          activity: string;
          companionType: string;
          designTheme?: string;
          contentFontMode: string;
          photoDataUrl: string | null;
          photoBlobUrl: string | null;
          photoBlobPathname: string | null;
          photoMimeType: string | null;
          photoSizeBytes: number | null;
          photoStorageProvider: string | null;
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
          contentFontMode,
          ...emptyPhoto,
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
          contentFontMode: true,
          photoDataUrl: true,
          photoBlobUrl: true,
          photoBlobPathname: true,
          photoMimeType: true,
          photoSizeBytes: true,
          photoStorageProvider: true,
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
          contentFontMode,
          ...emptyPhoto,
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
          contentFontMode: true,
          photoDataUrl: true,
          photoBlobUrl: true,
          photoBlobPathname: true,
          photoMimeType: true,
          photoSizeBytes: true,
          photoStorageProvider: true,
          generatedComment: true,
          includeInBook: true,
        },
      });
    }

    if (entry && photoPatch.kind === "set") {
      const photoDbFields = await resolveJournalEntryPhotoDbFields({
        patch: photoPatch,
        existing: null,
        profileId,
        entryId: entry.id,
      });
      entry = await prisma.journalEntry.update({
        where: { id: entry.id },
        data: photoDbFields,
        select: {
          id: true,
          content: true,
          createdAt: true,
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
          includeInBook: true,
        },
      });
    }

    if (entry && wasFirstJournal) {
      await markFreeTrialStartedIfFirstJournal({ email: viewerEmail, wasFirstJournal: true });
    }

    const kanteiOrderExists = await profileHasKanteiOrder(viewerEmail, profileId);
    const kanteiOrder = kanteiOrderExists
      ? await findKanteiOrderForProfile({ viewerEmail, profileId })
      : null;
    const guardianColorName =
      kanteiOrder?.birthMonth != null && kanteiOrder?.birthDay != null && parsedEntryDate
        ? guardianColorNameForEntryDate({
            birthMonth: kanteiOrder.birthMonth,
            birthDay: kanteiOrder.birthDay,
            entryDateYmd: journalEntryDateToIsoDateInput(parsedEntryDate),
          })
        : null;

    return NextResponse.json({
      entry: entry ? formatJournalEntryForApiResponse(entry) : null,
      kanteiOrderExists,
      guardianColorName,
      code: "OK",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "日記の保存に失敗しました。";
    return NextResponse.json({ error: message, code: "DB_SAVE" }, { status: 500 });
  }
}
