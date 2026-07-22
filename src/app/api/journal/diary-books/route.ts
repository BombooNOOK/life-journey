import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { assertFullAccessForApi } from "@/lib/entitlement/requireFullAccess";
import { parseDiaryBookCreateFields } from "@/lib/journal/diaryBookForm";
import { countDiaryBookPeriodEntriesWithTagScope } from "@/lib/journal/diaryBookIncludePicker";
import {
  NO_ENTRIES_IN_DIARY_BOOK_PERIOD_MESSAGE,
  NO_INCLUDED_ENTRIES_IN_DIARY_BOOK_PERIOD_MESSAGE,
} from "@/lib/journal/diaryBookPeriod";
import { resolveDiaryBookProfileId } from "@/lib/journal/diaryBookProfile";
import { refreshDiaryBookContent } from "@/lib/journal/diaryBookSnapshot";
import { listDiaryBooksForViewer } from "@/lib/journal/listDiaryBooks";

const JSON_NO_STORE = {
  headers: {
    "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  },
} as const;

export async function GET(req: Request) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json(
      { error: "ログイン情報を確認できませんでした。", code: "AUTH_REQUIRED" },
      { status: 401, ...JSON_NO_STORE },
    );
  }

  const url = new URL(req.url);
  const profileResult = await resolveDiaryBookProfileId(
    viewerEmail,
    url.searchParams.get("profileId"),
  );
  if (!profileResult.ok) {
    return NextResponse.json(
      { error: profileResult.error, code: profileResult.code },
      { status: profileResult.status, ...JSON_NO_STORE },
    );
  }

  const books = await listDiaryBooksForViewer({
    email: viewerEmail,
    profileId: profileResult.profileId,
  });

  return NextResponse.json({ books, code: "OK" }, JSON_NO_STORE);
}

export async function POST(req: Request) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json(
      { error: "ログイン情報を確認できませんでした。", code: "AUTH_REQUIRED" },
      { status: 401, ...JSON_NO_STORE },
    );
  }

  const denied = await assertFullAccessForApi(viewerEmail);
  if (denied) return denied;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { error: "JSONが不正です。", code: "BAD_JSON" },
      { status: 400, ...JSON_NO_STORE },
    );
  }

  const parsed = parseDiaryBookCreateFields(json);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error, code: parsed.code },
      { status: parsed.status, ...JSON_NO_STORE },
    );
  }

  const rawProfileId =
    typeof json === "object" && json !== null && "profileId" in json
      ? String((json as { profileId: unknown }).profileId)
      : "";
  const profileResult = await resolveDiaryBookProfileId(viewerEmail, rawProfileId);
  if (!profileResult.ok) {
    return NextResponse.json(
      { error: profileResult.error, code: profileResult.code },
      { status: profileResult.status, ...JSON_NO_STORE },
    );
  }

  const tagScope = {
    tagFilter: parsed.data.tagFilter,
    tagFilterMode: parsed.data.tagFilterMode,
  };

  const counts = await countDiaryBookPeriodEntriesWithTagScope({
    email: viewerEmail,
    profileId: profileResult.profileId,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
    tagScope,
  });

  if (counts.matchingCount < 1) {
    return NextResponse.json(
      {
        error: NO_ENTRIES_IN_DIARY_BOOK_PERIOD_MESSAGE,
        code: "NO_ENTRIES_IN_PERIOD",
      },
      { status: 422, ...JSON_NO_STORE },
    );
  }

  if (counts.includedCount < 1) {
    return NextResponse.json(
      {
        error: NO_INCLUDED_ENTRIES_IN_DIARY_BOOK_PERIOD_MESSAGE,
        code: "NO_INCLUDED_ENTRIES_IN_PERIOD",
      },
      { status: 422, ...JSON_NO_STORE },
    );
  }

  const row = await prisma.diaryBook.create({
    data: {
      email: viewerEmail,
      profileId: profileResult.profileId,
      title: parsed.data.title,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      coverTheme: parsed.data.coverTheme,
      pageTemplate: parsed.data.pageTemplate,
      tagFilter: parsed.data.tagFilter,
      tagFilterMode: parsed.data.tagFilterMode,
    },
  });

  const refreshed = await refreshDiaryBookContent({
    bookId: row.id,
    viewerEmail,
  });
  const snapshotEntryCount = refreshed.ok ? refreshed.entryCount : counts.includedCount;

  return NextResponse.json(
    {
      book: {
        id: row.id,
        title: row.title,
        startDate: row.startDate,
        endDate: row.endDate,
        coverTheme: row.coverTheme,
        pageTemplate: row.pageTemplate,
        entryCount: snapshotEntryCount,
        createdAt: row.createdAt.toISOString(),
      },
      code: "OK",
    },
    { status: 201, ...JSON_NO_STORE },
  );
}
