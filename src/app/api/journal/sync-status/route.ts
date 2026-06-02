import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getViewerEmailFromCookie, normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { entryDayKeyInJapan } from "@/lib/journal/journalNav";
import type { JournalSyncStatusResponse } from "@/lib/journal/syncStatusTypes";
import {
  journalProfileIdsForQuery,
  PROFILE_COOKIE_KEY,
  profileByIdForViewer,
  resolveActiveProfileId,
} from "@/lib/profile/activeProfile";

const JSON_NO_STORE = {
  headers: {
    "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  },
} as const;

function parseMonth(input: string | null): { from: Date; to: Date; key: string } | null {
  if (!input) return null;
  const m = /^(\d{4})-(\d{2})$/.exec(input.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }
  return {
    key: `${year}-${String(month).padStart(2, "0")}`,
    from: new Date(Date.UTC(year, month - 1, 1, 0, 0, 0)),
    to: new Date(Date.UTC(year, month, 1, 0, 0, 0)),
  };
}

function parseDayKey(input: string | null): string | null {
  if (!input) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim());
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

function buildFingerprint(parts: {
  viewerEmail: string;
  queriedProfileId: string;
  monthKey: string | null;
  entryIds: string[];
}): string {
  const raw = [
    parts.viewerEmail,
    parts.queriedProfileId,
    parts.monthKey ?? "*",
    ...[...parts.entryIds].sort(),
  ].join("|");
  return createHash("sha256").update(raw).digest("hex").slice(0, 16);
}

function buildBranchHints(checks: JournalSyncStatusResponse["checks"], entryId: string | null): string[] {
  const hints: string[] = [];
  if (!checks.authOk) {
    hints.push("AUTH: サーバー Cookie に viewerEmail がありません → 再ログイン");
    return hints;
  }
  if (checks.firebaseMatchesServer === false) {
    hints.push("AUTH: Firebase メールとサーバー Cookie が不一致 → ログアウト後に再ログイン");
  }
  if (!checks.profileOk) {
    hints.push("PROFILE: queriedProfileId が利用不可 → プロフィール切替");
  }
  if (entryId && checks.entryFound === false) {
    hints.push("DB/HOST: 指定 entry がこの DB に無い → host 不一致 or 別ユーザーで保存");
    return hints;
  }
  if (entryId && checks.entryBelongsToViewer === false) {
    hints.push("AUTH: entry は別ユーザーのもの → ログインアカウント不一致");
    return hints;
  }
  if (entryId && checks.entryVisibleUnderProfile === false) {
    hints.push("PROFILE: entry の profileId が queried と不一致 → プロフィール切替");
  }
  if (checks.dayHasEntry === false) {
    hints.push("API: 月クエリにその日の entry なし → profileId / 月 / 旧 profileId 空データを確認");
  }
  if (checks.monthHasAnyEntry && checks.dayHasEntry === true && entryId && checks.entryVisibleUnderProfile) {
    hints.push(
      "CALENDAR_UI: API にはあるのに印が出ない → /orders/calendar の月・日タップ・画面再読込を確認",
    );
  }
  if (hints.length === 0) {
    hints.push("OK: この端末の API 参照は整合。他端末と compareFingerprint を比較してください。");
  }
  return hints;
}

/** Mac / iPhone で「同じDB・ユーザー・プロフィール」を切り分ける診断 */
export async function GET(req: Request) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json(
      { error: "ログイン情報を確認できませんでした。", code: "AUTH_REQUIRED" },
      { status: 401, ...JSON_NO_STORE },
    );
  }

  const url = new URL(req.url);
  const cookieStore = await cookies();
  const cookieLoggedIn = cookieStore.get("lj_logged_in")?.value === "1";
  const cookieProfileId = cookieStore.get(PROFILE_COOKIE_KEY)?.value ?? null;
  const firebaseEmailFromClient = normalizeEmail(url.searchParams.get("firebaseEmail"));

  const rawProfileId = (url.searchParams.get("profileId") ?? "").trim();
  const activeProfileId = await resolveActiveProfileId(viewerEmail);
  const queriedProfileId = rawProfileId || activeProfileId;
  if (queriedProfileId) {
    const p = await profileByIdForViewer(queriedProfileId, viewerEmail);
    if (!p) {
      return NextResponse.json(
        { error: "指定プロフィールは利用できません。", code: "FORBIDDEN_PROFILE" },
        { status: 403, ...JSON_NO_STORE },
      );
    }
  }

  const month = parseMonth(url.searchParams.get("month"));
  const dayKey = parseDayKey(url.searchParams.get("day"));
  const requestedEntryId = (url.searchParams.get("entry") ?? "").trim() || null;

  const profileIds = journalProfileIdsForQuery(queriedProfileId, viewerEmail);
  const profileWhere =
    profileIds.length === 1 ? { profileId: profileIds[0]! } : { profileId: { in: profileIds } };

  const whereBase = {
    email: viewerEmail,
    ...(month ? { createdAt: { gte: month.from, lt: month.to } } : {}),
  };

  const [strictCount, orphanLegacyCount, monthRows, entryRow] = await Promise.all([
    prisma.journalEntry.count({
      where: { ...whereBase, profileId: queriedProfileId },
    }),
    profileIds.includes("")
      ? prisma.journalEntry.count({
          where: { ...whereBase, profileId: "" },
        })
      : Promise.resolve(0),
    prisma.journalEntry.findMany({
      where: { ...whereBase, ...profileWhere },
      orderBy: { updatedAt: "desc" },
      take: 200,
      select: {
        id: true,
        profileId: true,
        createdAt: true,
        updatedAt: true,
        content: true,
      },
    }),
    requestedEntryId
      ? prisma.journalEntry.findUnique({
          where: { id: requestedEntryId },
          select: {
            id: true,
            email: true,
            profileId: true,
            createdAt: true,
          },
        })
      : Promise.resolve(null),
  ]);

  const latestEntries = monthRows.slice(0, 5).map((row) => ({
    id: row.id,
    profileId: row.profileId,
    dayKeyJapan: entryDayKeyInJapan(row.createdAt.toISOString()),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    contentPreview: row.content.slice(0, 40),
  }));

  const dayEntryIds = dayKey
    ? monthRows
        .filter((row) => entryDayKeyInJapan(row.createdAt.toISOString()) === dayKey)
        .map((row) => row.id)
    : [];

  const entryDayJapan = entryRow ? entryDayKeyInJapan(entryRow.createdAt.toISOString()) : null;
  const entryVisibleUnderQueriedProfile = entryRow
    ? profileIds.includes(entryRow.profileId)
    : false;
  const entryInMonthRows = entryRow ? monthRows.some((r) => r.id === entryRow.id) : false;

  const checks: JournalSyncStatusResponse["checks"] = {
    authOk: Boolean(viewerEmail),
    profileOk: Boolean(queriedProfileId),
    monthHasAnyEntry: monthRows.length > 0,
    dayHasEntry: dayKey ? dayEntryIds.length > 0 : null,
    entryFound: requestedEntryId ? Boolean(entryRow) : null,
    entryBelongsToViewer: requestedEntryId ? entryRow?.email === viewerEmail : null,
    entryVisibleUnderProfile: requestedEntryId ? entryVisibleUnderQueriedProfile : null,
    firebaseMatchesServer: firebaseEmailFromClient
      ? firebaseEmailFromClient === normalizeEmail(viewerEmail)
      : null,
  };

  const payload: JournalSyncStatusResponse = {
    code: "OK",
    serverTime: new Date().toISOString(),
    deployment: {
      vercelEnv: process.env.VERCEL_ENV ?? null,
      vercelUrl: process.env.VERCEL_URL ?? null,
      requestHost: req.headers.get("host"),
    },
    auth: {
      cookieLoggedIn,
      viewerEmail,
      cookieProfileId,
      firebaseEmailFromClient: firebaseEmailFromClient || null,
      firebaseServerEmailMismatch: firebaseEmailFromClient
        ? firebaseEmailFromClient !== normalizeEmail(viewerEmail)
        : false,
    },
    profile: {
      activeProfileId,
      queriedProfileId,
      profileIdsUsedInQuery: profileIds,
      activeMatchesQueried: activeProfileId === queriedProfileId,
    },
    month: {
      key: month?.key ?? null,
      entryCountStrictProfile: strictCount,
      entryCountIncludingLegacyOrphan: monthRows.length,
      orphanLegacyProfileIdEmptyCount: orphanLegacyCount,
    },
    day: {
      key: dayKey,
      entryIds: dayEntryIds,
      entryCount: dayEntryIds.length,
    },
    entryProbe: {
      requestedId: requestedEntryId,
      found: Boolean(entryRow),
      belongsToViewer: entryRow ? entryRow.email === viewerEmail : false,
      profileId: entryRow?.profileId ?? null,
      dayKeyJapan: entryDayJapan,
      visibleUnderQueriedProfile: entryVisibleUnderQueriedProfile,
      includedInMonthQuery: entryInMonthRows,
      includedOnRequestedDay: dayKey && entryDayJapan ? entryDayJapan === dayKey : false,
    },
    latestEntries,
    compareFingerprint: buildFingerprint({
      viewerEmail,
      queriedProfileId,
      monthKey: month?.key ?? null,
      entryIds: monthRows.map((r) => r.id),
    }),
    checks,
    branchHints: buildBranchHints(checks, requestedEntryId),
  };

  return NextResponse.json(payload, JSON_NO_STORE);
}
